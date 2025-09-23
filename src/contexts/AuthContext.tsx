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
    // If Supabase is not configured, just set as unauthenticated
    if (!isSupabaseConfigured) {
      console.warn('Supabase not configured, setting user as unauthenticated');
      setAuthError('Authentication service is not configured. Please contact support.');
      setSession(null);
      setUser(null);
      setLoading(false);
      return;
    }

    // Get initial session with error handling
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          setAuthError('Failed to check authentication status. Please try refreshing the page.');
          // Don't throw, just set user to null and stop loading
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
        setAuthError(null);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('Failed to get initial session:', error);
        setAuthError('Authentication system is unavailable. Please try again later.');
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error) {
        console.error('Error in auth state change:', error);
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
          toast.success('Account created successfully!');
        } else {
          toast.success('Please check your email to confirm your account');
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
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    } finally {
      setLoading(false);
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