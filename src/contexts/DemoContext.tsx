import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface DemoStep {
  id: string;
  title: string;
  description: string;
  page: string;
  selector?: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: 'click' | 'navigate' | 'highlight' | 'input';
  content?: string;
  highlightElement?: string;
}

export interface DemoContextType {
  isDemo: boolean;
  currentStep: number;
  currentStepData: DemoStep | null;
  startDemo: () => void;
  endDemo: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipToStep: (stepIndex: number) => void;
  totalSteps: number;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

const demoSteps: DemoStep[] = [
  // Introduction
  {
    id: 'welcome',
    title: 'Welcome to OptiProfit Demo!',
    description: 'Let me show you how OptiProfit can revolutionize your optical practice\'s profitability. This demo will walk you through the complete workflow from managing costs to calculating profits.',
    page: '/',
    position: 'center'
  },
  
  // Step 1: Brands & Costs Introduction
  {
    id: 'brands-intro',
    title: 'Step 1: Manage Your Brands & Costs',
    description: 'First, we\'ll set up your supplier information and frame costs. This is the foundation of accurate profit calculations.',
    page: '/brands',
    position: 'center'
  },
  
  // Step 2: Add Company
  {
    id: 'add-company',
    title: 'Adding a New Company',
    description: 'Click the "Add New Company" button to add a supplier. We\'ll add some demo data for you.',
    page: '/brands',
    selector: '[data-demo="add-company-btn"]',
    action: 'highlight',
    position: 'bottom'
  },
  
  // Step 3: View Company Details
  {
    id: 'view-company',
    title: 'Your Company Data',
    description: 'Here you can see your suppliers with their brands and costs. Notice how each brand shows wholesale cost, your actual cost, and discount percentage.',
    page: '/brands',
    selector: '[data-demo="company-card"]',
    action: 'highlight',
    position: 'top'
  },
  
  // Step 4: Calculator Introduction
  {
    id: 'calculator-intro',
    title: 'Step 2: Calculate Frame Profits',
    description: 'Now let\'s use your cost data to calculate profits. The Calculator automatically imports the information you just set up.',
    page: '/calculator',
    position: 'center'
  },
  
  // Step 5: Select Company
  {
    id: 'select-company',
    title: 'Select Your Company',
    description: 'Choose the company whose frame you\'re pricing. Notice how all your companies from Brands & Costs appear here.',
    page: '/calculator',
    selector: '[data-demo="company-dropdown"]',
    action: 'highlight',
    position: 'bottom'
  },
  
  // Step 6: Select Brand
  {
    id: 'select-brand',
    title: 'Choose the Brand',
    description: 'Select the specific brand. Watch how the cost fields auto-populate with your saved data - no manual entry needed!',
    page: '/calculator',
    selector: '[data-demo="brand-dropdown"]',
    action: 'highlight',
    position: 'bottom'
  },
  
  // Step 7: Auto-Population
  {
    id: 'auto-populate',
    title: 'Automatic Cost Population',
    description: 'See how your cost, wholesale price, and tariff tax are automatically filled in? This saves time and ensures accuracy.',
    page: '/calculator',
    selector: '[data-demo="cost-fields"]',
    action: 'highlight',
    position: 'right'
  },
  
  // Step 8: Adjust Retail Price
  {
    id: 'retail-price',
    title: 'Set Your Retail Price',
    description: 'Adjust the retail price based on what your practice actually charges for this frame. The profit calculation updates in real-time.',
    page: '/calculator',
    selector: '[data-demo="retail-price"]',
    action: 'highlight',
    position: 'right'
  },
  
  // Step 9: View Profit Results
  {
    id: 'profit-results',
    title: 'Your Profit Analysis',
    description: 'See your complete profit breakdown: total profit, profit margin, patient payment after insurance, and more. All calculated instantly!',
    page: '/calculator',
    selector: '[data-demo="profit-display"]',
    action: 'highlight',
    position: 'left'
  },
  
  // Step 10: Save Calculation
  {
    id: 'save-calculation',
    title: 'Save for Future Reference',
    description: 'Save this calculation to your account. You can always refer back to it or use it for comparisons.',
    page: '/calculator',
    selector: '[data-demo="save-btn"]',
    action: 'highlight',
    position: 'top'
  },
  
  // Step 11: Profit Comparison Introduction
  {
    id: 'comparison-intro',
    title: 'Compare Frame Profitability',
    description: 'Now let\'s see the most powerful feature - comparing two frames side-by-side to find out which one makes you more money!',
    page: '/calculator',
    selector: '[data-demo="comparison-tab"]',
    action: 'highlight',
    position: 'bottom'
  },
  
  // Step 12: Comparison Tool Overview
  {
    id: 'comparison-overview',
    title: 'Side-by-Side Comparison',
    description: 'The Profit Comparison tool lets you compare two different brands or even frames from the same brand. Enter costs for both frames just like before.',
    page: '/calculator',
    selector: '[data-demo="comparison-form"]',
    action: 'highlight',
    position: 'top'
  },
  
  // Step 13: Comparison Results
  {
    id: 'comparison-results',
    title: 'See Which Frame Wins',
    description: 'The comparison shows you exactly which frame is more profitable, by how much, and why. Green highlights the winner in each category!',
    page: '/calculator',
    selector: '[data-demo="comparison-display"]',
    action: 'highlight',
    position: 'top'
  },
  
  // Step 14: Dashboard Introduction
  {
    id: 'dashboard-intro',
    title: 'Step 3: Track Your Performance',
    description: 'Finally, let\'s see your practice\'s overall performance metrics in the Dashboard.',
    page: '/dashboard',
    position: 'center'
  },
  
  // Step 15: Performance Metrics
  {
    id: 'performance-metrics',
    title: 'Your Practice Analytics',
    description: 'Monitor Total Frame Profit, Total Frames Sold, Average Profit Per Frame, and your Top Selling Brand. All the insights you need to grow your business!',
    page: '/dashboard',
    selector: '[data-demo="metrics-cards"]',
    action: 'highlight',
    position: 'bottom'
  },
  
  // Step 16: Conclusion
  {
    id: 'conclusion',
    title: 'Demo Complete!',
    description: 'You\'ve seen the complete OptiProfit workflow: managing costs → calculating profits → comparing options → tracking performance. Ready to boost your practice\'s profitability?',
    page: '/dashboard',
    position: 'center'
  }
];

interface DemoProviderProps {
  children: ReactNode;
}

export const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const currentStepData = isDemo && currentStep < demoSteps.length ? demoSteps[currentStep] : null;

  const startDemo = () => {
    // Demo mode no longer uses localStorage - all data comes from Supabase
    setIsDemo(true);
    setCurrentStep(0);
    navigate('/');
  };

  const endDemo = () => {
    setIsDemo(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      const nextStepData = demoSteps[currentStep + 1];
      setCurrentStep(currentStep + 1);
      
      // Navigate to the next step's page if different
      if (nextStepData.page !== demoSteps[currentStep].page) {
        navigate(nextStepData.page);
      }
    } else {
      endDemo();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      const prevStepData = demoSteps[currentStep - 1];
      setCurrentStep(currentStep - 1);
      
      // Navigate to the previous step's page if different
      if (prevStepData.page !== demoSteps[currentStep].page) {
        navigate(prevStepData.page);
      }
    }
  };

  const skipToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < demoSteps.length) {
      const targetStep = demoSteps[stepIndex];
      setCurrentStep(stepIndex);
      navigate(targetStep.page);
    }
  };

  return (
    <DemoContext.Provider
      value={{
        isDemo,
        currentStep,
        currentStepData,
        startDemo,
        endDemo,
        nextStep,
        prevStep,
        skipToStep,
        totalSteps: demoSteps.length
      }}
    >
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