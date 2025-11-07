import { useContext } from 'react';
import { useDemo as useDemoContext } from '../contexts/DemoContext';

// Re-export the demo context hook for convenience
export const useDemo = useDemoContext;

// Helper hook to check if we're in demo mode
export const useDemoMode = () => {
  const { isActive, demoData } = useDemo();
  
  return {
    isDemo: isActive,
    demoData,
    isDemoMode: isActive && !!demoData
  };
};

// Helper hook to get demo data with fallback to real data
export const useDemoAwareData = <T>(realData: T, demoKey?: keyof typeof demoData): T => {
  const { isActive, demoData } = useDemo();
  
  if (isActive && demoData && demoKey) {
    return (demoData[demoKey] as T) || realData;
  }
  
  return realData;
};

// Helper hook for components that need to inject demo data
export const useDemoDataInjection = () => {
  const { isActive, demoData } = useDemo();
  
  // Get demo data from session storage (set by DemoProvider)
  const getSessionDemoData = () => {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = sessionStorage.getItem('demoData');
      const isDemoMode = sessionStorage.getItem('isDemoMode') === 'true';
      
      if (isDemoMode && data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to parse demo data from session storage:', error);
    }
    
    return null;
  };
  
  const sessionDemoData = getSessionDemoData();
  
  return {
    isDemo: isActive || !!sessionDemoData,
    demoData: demoData || sessionDemoData,
    isDemoMode: isActive || !!sessionDemoData
  };
};

export default useDemo;