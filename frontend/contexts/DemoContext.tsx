import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  DemoData,
  DEMO_DATA,
  fetchDemoData,
  cleanupDemoSession,
  updateDemoProgress,
} from '../demo/mockData';

export interface DemoState {
  isActive: boolean;
  isLoading: boolean;
  currentStep: number;
  totalSteps: number;
  demoData: DemoData | null;
  originalUserData: any | null;
}

export interface DemoContextType extends DemoState {
  startDemo: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipDemo: () => void;
  goToStep: (step: number) => void;
  endDemo: () => void;
  injectDemoData: () => void;
  restoreUserData: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [state, setState] = useState<DemoState>({
    isActive: false,
    isLoading: false,
    currentStep: 0,
    totalSteps: 12, // Updated for 11-step demo flow + welcome step
    demoData: null,
    originalUserData: null
  });

  const injectDemoData = useCallback(() => {
    setState(prev => ({
      ...prev,
      demoData: DEMO_DATA
    }));
    console.log('💉 Demo data injected:', DEMO_DATA);
  }, []);

  const restoreUserData = useCallback(() => {
    setState(prev => ({
      ...prev,
      demoData: null
    }));
    console.log('🔄 User data restored, demo data cleared');
  }, []);

  const startDemo = useCallback(async () => {
    console.log('🎬 Starting Driver.js demo...');

    // Set demo mode flag in sessionStorage for API calls
    // This tells the API service to use the demo user ID (3251cae7-ee61-4c5f-be4c-4312c17ef4fd)
    sessionStorage.setItem('demo_session_id', 'active');
    console.log('🎭 Demo mode activated - API will return demo account data');

    setState(prev => ({
      ...prev,
      isActive: true,
      isLoading: false, // No async loading needed
      currentStep: 1,
      demoData: DEMO_DATA // Used for type structure, actual data comes from backend API
    }));

    console.log('✅ Demo initialized');
    console.log('📊 Backend API will return Order #6817 with 18 frames from database');
    console.log('🎯 Navigate to /frames/orders to see demo data');
  }, []);

  const nextStep = useCallback(async () => {
    if (state.currentStep < state.totalSteps) {
      const newStep = state.currentStep + 1;

      setState(prev => ({
        ...prev,
        currentStep: newStep
      }));

      // Track progress in backend
      try {
        const completedSteps = Array.from({ length: state.currentStep }, (_, i) => i + 1);
        await updateDemoProgress(newStep, completedSteps);
      } catch (error) {
        console.error('⚠️ Error updating demo progress:', error);
        // Don't block UI on progress tracking failure
      }
    } else {
      endDemo();
    }
  }, [state.currentStep, state.totalSteps]);

  const previousStep = useCallback(() => {
    if (state.currentStep > 1) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
  }, [state.currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= state.totalSteps) {
      setState(prev => ({
        ...prev,
        currentStep: step
      }));
    }
  }, [state.totalSteps]);

  const skipDemo = useCallback(() => {
    console.log('⏭️ Demo skipped by user');
    endDemo();
  }, []);

  const endDemo = useCallback(async () => {
    console.log('🛑 Demo ended, cleaning up...');

    // Remove demo mode flag from sessionStorage
    sessionStorage.removeItem('demo_session_id');
    console.log('🧹 Demo mode flag cleared from sessionStorage');

    // Cleanup demo session in backend
    try {
      await cleanupDemoSession();
      console.log('✅ Demo session cleaned up');
    } catch (error) {
      console.error('⚠️ Error cleaning up demo session:', error);
    }

    setState({
      isActive: false,
      isLoading: false,
      currentStep: 0,
      totalSteps: 12, // Updated for 11-step demo flow + welcome step
      demoData: null,
      originalUserData: null
    });

    restoreUserData();
  }, [restoreUserData]);

  const value: DemoContextType = {
    ...state,
    startDemo,
    nextStep,
    previousStep,
    skipDemo,
    goToStep,
    endDemo,
    injectDemoData,
    restoreUserData
  };

  return (
    <DemoContext.Provider value={value}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
