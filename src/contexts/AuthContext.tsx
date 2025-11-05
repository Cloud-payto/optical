import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInAsDemo: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[AUTH CONTEXT] Initializing authentication...');
    
    // If Supabase is not configured, just set as unauthenticated
    if (!isSupabaseConfigured) {
      console.warn('[AUTH CONTEXT] Supabase not configured, setting user as unauthenticated');
      setAuthError('Authentication service is not configured. Please check environment variables.');
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Check if supabase client exists
    if (!supabase) {
      console.error('[AUTH CONTEXT] Supabase client is undefined!');
      setAuthError('Authentication client failed to initialize.');
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        console.log('[AUTH CONTEXT] Checking for existing session...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 10000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as Awaited<typeof sessionPromise>;
        
        if (error) {
          console.error('[AUTH CONTEXT] Error getting session:', error);
          setAuthError(`Authentication check failed: ${error.message}`);
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        console.log('[AUTH CONTEXT] Session check complete:', {
          hasSession: !!session,
          userId: session?.user?.id || 'none',
          email: session?.user?.email || 'none'
        });
        
        setAuthError(null);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('[AUTH CONTEXT] Failed to get initial session:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Provide specific error messages
        if (errorMessage.includes('timeout')) {
          setAuthError('Authentication service is not responding. Please check your connection.');
        } else if (errorMessage.includes('NetworkError')) {
          setAuthError('Network error. Please check your internet connection.');
        } else {
          setAuthError(`Authentication failed: ${errorMessage}`);
        }
        
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    let subscription: any = null;
    
    try {
      console.log('[AUTH CONTEXT] Setting up auth state listener...');
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log('[AUTH CONTEXT] Auth state changed:', event, {
          hasSession: !!session,
          userId: session?.user?.id || 'none'
        });
        
        try {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          
          // Clear any previous errors on successful auth state change
          if (session) {
            setAuthError(null);
          }
        } catch (error) {
          console.error('[AUTH CONTEXT] Error in auth state change handler:', error);
          setSession(null);
          setUser(null);
          setLoading(false);
        }
      });
      
      subscription = data.subscription;
      console.log('[AUTH CONTEXT] Auth state listener setup complete');
    } catch (error) {
      console.error('[AUTH CONTEXT] Failed to setup auth state listener:', error);
    }

    return () => {
      if (subscription) {
        console.log('[AUTH CONTEXT] Cleaning up auth state listener');
        subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      toast.error('Authentication is not configured. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast.success('Welcome back!');
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign in error:', authError);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to sign in';
      if (authError.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (authError.message.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and confirm your account';
      } else if (authError.message.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait and try again';
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      toast.error('Authentication is not configured. Please contact support.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        if (data.user.email_confirmed_at) {
          toast.success('Account created successfully! Let\'s set up your profile.');
          // Redirect to onboarding will happen automatically after state updates
          window.location.href = '/onboarding';
        } else {
          toast.success('Account created! Please check your email to confirm, then complete your profile.');
          // Still redirect to onboarding for users who need email confirmation
          setTimeout(() => {
            window.location.href = '/onboarding';
          }, 2000);
        }
      }
    } catch (error) {
      const authError = error as AuthError;
      console.error('Sign up error:', authError);
      
      let errorMessage = 'Failed to create account';
      if (authError.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (authError.message.includes('Password should be')) {
        errorMessage = 'Password should be at least 6 characters';
      } else if (authError.message.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address';
      }
      
      toast.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Authentication is not configured. Please contact support.');
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Clear user state immediately
      setUser(null);
      setSession(null);

      toast.success('Signed out successfully');

      // Redirect will happen automatically via ProtectedRoute
      // since user state is now null
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const signInAsDemo = async () => {
    if (!isSupabaseConfigured) {
      toast.error('Authentication is not configured. Please contact support.');
      return;
    }

    try {
      await signIn('demo@optical-software.com', 'DemoAccount2024');
      toast.success('Welcome to the demo!', {
        icon: '🎬',
        duration: 4000,
      });
    } catch (error) {
      console.error('Demo login error:', error);
      toast.error('Demo account is temporarily unavailable. Please try again later.');
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    authError,
    signIn,
    signUp,
    signOut,
    signInAsDemo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}