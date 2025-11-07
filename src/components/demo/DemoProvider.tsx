import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver, Driver, Config } from 'driver.js';
import { useDemo } from '../../contexts/DemoContext';
import { demoSteps } from '../../demo/demoSteps';
import { demoController } from '../../demo/demoUtils';
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
        showProgress: true,
        showButtons: ['next', 'previous', 'close'],
        disableActiveInteraction: false,
        allowClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        popoverClass: 'demo-popover',
        popoverOffset: 10,
        
        onNextClick: (element, step) => {
          const currentIndex = driverRef.current?.getActiveIndex() ?? 0;
          console.log(`▶️ Next button clicked - Driver.js moving from step ${currentIndex + 1} to ${currentIndex + 2}`);
          // Let Driver.js handle step progression naturally
          // We'll sync React state in onHighlightStarted
        },
        
        onPrevClick: (element, step) => {
          const currentIndex = driverRef.current?.getActiveIndex() ?? 0;
          console.log(`◀️ Previous button clicked - Driver.js moving from step ${currentIndex + 1} to ${currentIndex}`);
          // Let Driver.js handle step progression naturally
        },
        
        onCloseClick: () => {
          console.log('❌ Close button clicked - skipping demo');
          skipDemo();
        },

        onDestroyed: () => {
          console.log('🛑 Driver.js destroyed, cleaning up demo...');
          endDemo();
          demoController.cleanupDemoData();
        },

        onHighlightStarted: async (element, step) => {
          try {
            const stepIndex = driverRef.current?.getActiveIndex() ?? 0;
            const currentStepData = demoSteps[stepIndex];
            
            console.log(`✨ Highlighting step ${stepIndex + 1}/${demoSteps.length}:`, currentStepData?.id);
            
            // Sync React state with Driver.js step
            if (currentStep !== stepIndex + 1) {
              console.log(`🔄 Syncing React state: ${currentStep} -> ${stepIndex + 1}`);
              // Update React state without triggering navigation
            }
            
            // Handle navigation if required
            if (currentStepData?.requiresNavigation && currentStepData.page !== location.pathname) {
              console.log(`🚀 Step ${stepIndex + 1} requires navigation to ${currentStepData.page}`);
              
              try {
                await demoController.navigateToPage(currentStepData.page);
                
                // Wait for elements to be available after navigation
                if (currentStepData.element && currentStepData.element !== 'body') {
                  console.log(`⏳ Waiting for element: ${currentStepData.element}`);
                  const element = await demoController.waitForElement(currentStepData.element, 5000);
                  if (!element) {
                    console.warn(`⚠️ Element not found: ${currentStepData.element}`);
                  }
                }
              } catch (navError) {
                console.error(`❌ Navigation failed for step ${stepIndex + 1}:`, navError);
              }
            }

            // Handle tab clicks if specified
            if (currentStepData?.tabToClick) {
              setTimeout(() => {
                console.log(`🖱️ Auto-clicking tab: ${currentStepData.tabToClick}`);
                demoController.clickTab(currentStepData.tabToClick!);
              }, 1000);
            }

            // Create spotlight effect
            if (element) {
              demoController.createSpotlight(`[data-driver-element-id="${step.element}"]`);
            }
          } catch (error) {
            console.error('❌ Error in onHighlightStarted:', error);
          }
        },

        // Remove custom popover rendering for now to fix the error
        // We'll use Driver.js built-in popover system

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
      console.log('🎬 Starting Driver.js tour...');
      try {
        driverInstance.drive();
        console.log('✅ Driver.js tour started successfully');
      } catch (error) {
        console.error('❌ Failed to start Driver.js tour:', error);
      }
    }

    return () => {
      if (driverRef.current && !isActive) {
        driverRef.current.destroy();
        driverRef.current = null;
        demoController.disableKeyboardNavigation();
      }
    };
  }, [isActive, currentStep, location.pathname]);

  // Note: Removed conflicting useEffect that was calling drive(stepIndex)
  // This was causing Driver.js and React state to be out of sync
  // Driver.js now handles step progression naturally

  // Update navigation helper when location changes
  useEffect(() => {
    if (demoController.getNavigation()) {
      console.log(`🗺️ Location changed to: ${location.pathname}`);
      demoController.updateCurrentPath(location.pathname);
    }
  }, [location.pathname]);

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