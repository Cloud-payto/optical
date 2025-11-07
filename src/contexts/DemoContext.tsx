import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { DemoData, DEMO_DATA } from '../demo/mockData';

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
    totalSteps: 14,
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

  const startDemo = useCallback(() => {
    console.log('🎬 Starting Driver.js demo...');
    
    setState(prev => ({
      ...prev,
      isActive: true,
      isLoading: true,
      currentStep: 1
    }));

    // Inject demo data
    injectDemoData();

    setState(prev => ({
      ...prev,
      isLoading: false
    }));
  }, [injectDemoData]);

  const nextStep = useCallback(() => {
    if (state.currentStep < state.totalSteps) {
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
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

  const endDemo = useCallback(() => {
    console.log('🛑 Demo ended, cleaning up...');
    
    setState({
      isActive: false,
      isLoading: false,
      currentStep: 0,
      totalSteps: 14,
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
