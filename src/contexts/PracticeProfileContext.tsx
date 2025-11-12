import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { PracticeProfile } from '../types/practiceProfile';
import {
  fetchPracticeProfile,
  savePracticeProfile,
  updatePracticeProfile,
  getQuestionnaireStatus,
  PracticeProfileData,
} from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface PracticeProfileContextType {
  profile: PracticeProfile | null;
  loading: boolean;
  isCompleted: boolean;
  isSkipped: boolean;
  lastPrompted: string | null;
  refreshProfile: () => Promise<void>;
  saveProfile: (data: PracticeProfileData) => Promise<void>;
  updateProfile: (data: Partial<PracticeProfileData>) => Promise<void>;
}

const PracticeProfileContext = createContext<PracticeProfileContextType | undefined>(undefined);

export function usePracticeProfile() {
  const context = useContext(PracticeProfileContext);
  if (context === undefined) {
    throw new Error('usePracticeProfile must be used within a PracticeProfileProvider');
  }
  return context;
}

interface PracticeProfileProviderProps {
  children: ReactNode;
}

export function PracticeProfileProvider({ children }: PracticeProfileProviderProps) {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PracticeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSkipped, setIsSkipped] = useState(false);
  const [lastPrompted, setLastPrompted] = useState<string | null>(null);

  const refreshProfile = async () => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch profile data
      const profileData = await fetchPracticeProfile();
      setProfile(profileData);

      // Fetch questionnaire status
      const status = await getQuestionnaireStatus();
      setIsCompleted(status.completed);
      setIsSkipped(status.skipped);
      setLastPrompted(status.lastPrompted);
    } catch (error) {
      console.error('Failed to fetch practice profile:', error);
      // Don't show error toast on initial load - it's OK if profile doesn't exist yet
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, [user, isAuthenticated]);

  const saveProfile = async (data: PracticeProfileData) => {
    try {
      setLoading(true);
      const savedProfile = await savePracticeProfile(data);
      setProfile(savedProfile);
      setIsCompleted(true);
      setIsSkipped(false);
      toast.success('Practice profile saved successfully!');
    } catch (error) {
      console.error('Failed to save practice profile:', error);
      toast.error('Failed to save practice profile. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<PracticeProfileData>) => {
    try {
      setLoading(true);
      const updatedProfile = await updatePracticeProfile(data);
      setProfile(updatedProfile);
      toast.success('Practice profile updated successfully!');
    } catch (error) {
      console.error('Failed to update practice profile:', error);
      toast.error('Failed to update practice profile. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    profile,
    loading,
    isCompleted,
    isSkipped,
    lastPrompted,
    refreshProfile,
    saveProfile,
    updateProfile,
  };

  return (
    <PracticeProfileContext.Provider value={value}>
      {children}
    </PracticeProfileContext.Provider>
  );
}
