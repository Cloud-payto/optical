import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

const STORAGE_KEY = 'presentation_mode';

export interface PresentationModeContextType {
  isPresentationMode: boolean;
  togglePresentationMode: () => void;
  enablePresentationMode: () => void;
  disablePresentationMode: () => void;
}

const PresentationModeContext = createContext<PresentationModeContextType | undefined>(undefined);

interface PresentationModeProviderProps {
  children: ReactNode;
}

export const PresentationModeProvider: React.FC<PresentationModeProviderProps> = ({ children }) => {
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(() => {
    // Initialize from sessionStorage
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(STORAGE_KEY) === 'true';
    }
    return false;
  });

  // Sync to sessionStorage whenever state changes
  useEffect(() => {
    if (isPresentationMode) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [isPresentationMode]);

  const togglePresentationMode = useCallback(() => {
    setIsPresentationMode(prev => !prev);
  }, []);

  const enablePresentationMode = useCallback(() => {
    setIsPresentationMode(true);
  }, []);

  const disablePresentationMode = useCallback(() => {
    setIsPresentationMode(false);
  }, []);

  const value: PresentationModeContextType = {
    isPresentationMode,
    togglePresentationMode,
    enablePresentationMode,
    disablePresentationMode,
  };

  return (
    <PresentationModeContext.Provider value={value}>
      {children}
    </PresentationModeContext.Provider>
  );
};

export const usePresentationMode = (): PresentationModeContextType => {
  const context = useContext(PresentationModeContext);
  if (context === undefined) {
    throw new Error('usePresentationMode must be used within a PresentationModeProvider');
  }
  return context;
};
