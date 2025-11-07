import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver, Driver, Config } from 'driver.js';
import { createRoot } from 'react-dom/client';
import { useDemo } from '../../contexts/DemoContext';
import { demoSteps } from '../../demo/demoSteps';
import { demoController } from '../../demo/demoUtils';
import DemoTooltip from './DemoTooltip';
import 'driver.js/dist/driver.css';

interface DemoProviderProps {
  children: React.ReactNode;
}

const DemoProvider: React.FC<DemoProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const driverRef = useRef<Driver | null>(null);
  const { 
    isActive, 
    currentStep, 
    totalSteps, 
    nextStep, 
    previousStep, 
    skipDemo, 
    endDemo,
    injectDemoData,
    demoData 
  } = useDemo();

  // Initialize Driver.js when demo becomes active
  useEffect(() => {
    if (isActive && !driverRef.current) {
      console.log('🎬 Initializing Driver.js demo...');
      
      // Set up navigation helper for demo controller
      demoController.setNavigation({
        navigate,
        currentPath: location.pathname
      });

      // Inject demo data
      if (demoData) {
        demoController.injectDemoData(demoData);
      }

      // Create Driver.js configuration
      const driverConfig: Config = {
        showProgress: false, // We'll handle this in our custom tooltip
        showButtons: [], // Hide default buttons, use our custom ones
        disableActiveInteraction: false,
        allowClose: false,
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        popoverClass: 'demo-popover',
        
        // Custom popover rendering
        popoverOffset: 10,
        
        onNextClick: () => {
          nextStep();
        },
        
        onPrevClick: () => {
          previousStep();
        },
        
        onCloseClick: () => {
          skipDemo();
        },

        onDestroyed: () => {
          console.log('🛑 Driver.js destroyed, cleaning up demo...');
          endDemo();
          demoController.cleanupDemoData();
        },

        onHighlightStarted: (element, step) => {
          console.log(`✨ Highlighting step ${currentStep}:`, step);
          
          // Handle navigation if required
          const currentStepData = demoSteps[currentStep - 1];
          if (currentStepData?.requiresNavigation && currentStepData.page !== location.pathname) {
            demoController.navigateToPage(currentStepData.page);
          }

          // Handle tab clicks if specified
          if (currentStepData?.tabToClick) {
            setTimeout(() => {
              demoController.clickTab(currentStepData.tabToClick!);
            }, 500);
          }

          // Create spotlight effect
          if (element) {
            demoController.createSpotlight(`[data-driver-element-id="${step.element}"]`);
          }
        },

        onPopoverRender: (popover, { config, state }) => {
          const currentStepData = demoSteps[currentStep - 1];
          if (!currentStepData) return;

          // Clear default content
          popover.innerHTML = '';

          // Create our custom tooltip
          const tooltipContainer = document.createElement('div');
          popover.appendChild(tooltipContainer);

          const root = createRoot(tooltipContainer);
          root.render(
            <DemoTooltip
              title={currentStepData.popover?.title || ''}
              description={currentStepData.popover?.description || ''}
              currentStep={currentStep}
              totalSteps={totalSteps}
              onNext={nextStep}
              onPrevious={previousStep}
              onSkip={skipDemo}
              canGoNext={currentStep < totalSteps}
              canGoPrevious={currentStep > 1}
              position={currentStepData.popover?.side as any}
            />
          );
        },

        steps: demoSteps.map((step, index) => ({
          element: step.element || 'body',
          popover: {
            title: step.popover?.title || '',
            description: step.popover?.description || '',
            side: step.popover?.side || 'bottom',
            align: step.popover?.align || 'center'
          }
        }))
      };

      // Create and start driver
      const driverInstance = driver(driverConfig);
      driverRef.current = driverInstance;
      demoController.setDriver(driverInstance);
      
      // Enable keyboard navigation
      demoController.enableKeyboardNavigation();

      // Start the tour
      driverInstance.drive();
    }

    return () => {
      if (driverRef.current && !isActive) {
        driverRef.current.destroy();
        driverRef.current = null;
        demoController.disableKeyboardNavigation();
      }
    };
  }, [isActive, currentStep, location.pathname]);

  // Update driver step when currentStep changes
  useEffect(() => {
    if (driverRef.current && isActive && currentStep > 0) {
      const stepIndex = currentStep - 1;
      if (stepIndex < demoSteps.length) {
        driverRef.current.drive(stepIndex);
      }
    }
  }, [currentStep, isActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        demoController.cleanupDemoData();
        demoController.disableKeyboardNavigation();
      }
    };
  }, []);

  return <>{children}</>;
};

export default DemoProvider;