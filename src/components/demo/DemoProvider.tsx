import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { driver, Config } from 'driver.js';
import type { DriveStep } from 'driver.js';
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
  const driverRef = useRef<any | null>(null);
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
        
        onNextClick: async (element, step) => {
          const currentIndex = driverRef.current?.getActiveIndex() ?? 0;
          const nextIndex = currentIndex + 1;
          console.log(`▶️ Next button clicked - Driver.js moving from step ${currentIndex + 1} to ${nextIndex + 1}`);
          
          // Just log for debugging - don't interfere with Driver.js progression
          if (nextIndex < demoSteps.length) {
            const nextStep = demoSteps[nextIndex];
            const nextElement = nextStep.element || 'body';
            
            console.log(`📋 Next step details:`, {
              stepId: nextStep.id,
              page: nextStep.page,
              element: nextElement,
              currentPage: window.location.pathname
            });
            
            const elementExists = nextElement === 'body' || document.querySelector(nextElement);
            console.log(`🔍 Next step ${nextIndex + 1} element "${nextElement}" exists:`, !!elementExists);
          }
          
          // Always let Driver.js handle progression - don't interfere
          console.log(`✅ Allowing Driver.js to handle progression naturally`);
        },
        
        onPrevClick: (element, step) => {
          const currentIndex = driverRef.current?.getActiveIndex() ?? 0;
          console.log(`◀️ Previous button clicked - Driver.js moving from step ${currentIndex + 1} to ${currentIndex}`);
          // Let Driver.js handle step progression naturally
        },
        
        onCloseClick: () => {
          console.log('❌ Close button clicked - skipping demo');
          // Force cleanup immediately
          if (driverRef.current) {
            try {
              driverRef.current.destroy();
            } catch (error) {
              console.warn('⚠️ Error destroying driver on close:', error);
            }
            driverRef.current = null;
          }
          
          // Remove any stuck overlays
          const overlays = document.querySelectorAll('.driver-overlay, .driver-popover-wrapper, .demo-spotlight-overlay');
          overlays.forEach(overlay => overlay.remove());
          
          skipDemo();
        },

        onDestroyed: () => {
          console.log('🛑 Driver.js destroyed, cleaning up demo...');
          
          // Force cleanup of any remaining elements
          setTimeout(() => {
            const overlays = document.querySelectorAll('.driver-overlay, .driver-popover-wrapper, .demo-spotlight-overlay');
            if (overlays.length > 0) {
              console.log('🧹 Removing stuck overlays:', overlays.length);
              overlays.forEach(overlay => overlay.remove());
            }
            
            // Reset body styles that might be stuck
            document.body.style.overflow = '';
            document.body.style.pointerEvents = '';
          }, 100);
          
          endDemo();
          demoController.cleanupDemoData();
        },

        onHighlightStarted: async (element, step) => {
          try {
            const stepIndex = driverRef.current?.getActiveIndex() ?? 0;
            const currentStepData = demoSteps[stepIndex];
            
            console.log(`✨ Highlighting step ${stepIndex + 1}/${demoSteps.length}:`, currentStepData?.id);
            console.log(`📍 Current page: ${location.pathname}, Target page: ${currentStepData?.page}`);
            console.log(`🎯 Looking for element: ${step.element}`);
            
            // Check if target element exists
            const targetElement = step.element === 'body' ? document.body : document.querySelector(step.element);
            console.log(`🔍 Element "${step.element}" found:`, !!targetElement);
            
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
                    console.warn(`⚠️ Element not found after navigation: ${currentStepData.element}`);
                  } else {
                    console.log(`✅ Element found after navigation!`);
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

        steps: demoSteps.map((step, index) => {
          const element = step.element || 'body';
          
          return {
            element: element,
            popover: {
              title: step.popover?.title || `Step ${index + 1}`,
              description: step.popover?.description || 'Demo step description',
              side: step.popover?.side || 'bottom',
              align: step.popover?.align || 'center'
            }
          };
        })
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