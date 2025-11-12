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

      // Navigate to first step's page if required
      const firstStep = demoSteps[0];
      if (firstStep.requiresNavigation && firstStep.page !== location.pathname) {
        console.log(`🚀 Navigating to first step page: ${firstStep.page}`);
        navigate(firstStep.page);
        // Wait for navigation and React rendering before starting tour
        // The tour will start after navigation completes (in the next effect cycle)
        return;
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
          console.log(`▶️ Next button clicked - preparing step ${nextIndex + 1}`);

          // Get button references for loading state
          const nextButton = document.querySelector('.driver-popover-next-btn') as HTMLButtonElement;
          const prevButton = document.querySelector('.driver-popover-prev-btn') as HTMLButtonElement;
          const closeButton = document.querySelector('.driver-popover-close-btn') as HTMLButtonElement;

          // Store original button text
          const originalNextText = nextButton?.textContent;

          try {
            // Handle navigation and validation for next step
            if (nextIndex < demoSteps.length) {
              const nextStep = demoSteps[nextIndex];
              const nextElement = nextStep.element || 'body';

              console.log(`📋 Next step details:`, {
                stepId: nextStep.id,
                page: nextStep.page,
                element: nextElement,
                currentPage: window.location.pathname,
                requiresNav: nextStep.requiresNavigation
              });

              // Navigate and wait for completion if required
              if (nextStep.requiresNavigation && nextStep.page !== window.location.pathname) {
                console.log(`🚀 Navigating to ${nextStep.page} for step ${nextIndex + 1}`);

                // Disable buttons during navigation
                if (nextButton) {
                  nextButton.disabled = true;
                  nextButton.textContent = 'Loading...';
                }
                if (prevButton) prevButton.disabled = true;
                if (closeButton) closeButton.disabled = true;

                try {
                  await demoController.navigateToPage(nextStep.page);

                  // Wait for target element if specified
                  if (nextStep.element && nextStep.element !== 'body') {
                    console.log(`⏳ Waiting for element: ${nextStep.element}`);
                    const targetElement = await demoController.waitForElement(nextStep.element, 5000);

                    if (!targetElement) {
                      console.error(`❌ Element not found after navigation: ${nextStep.element}`);
                    } else {
                      console.log(`✅ Element ready: ${nextStep.element}`);
                    }
                  }

                  // Additional wait for React rendering and component mounting
                  await new Promise(resolve => setTimeout(resolve, 800)); // INCREASED: 300ms → 800ms for better stability
                } catch (navError) {
                  console.error(`❌ Navigation failed:`, navError);
                }
              } else {
                // Validate element exists if not navigating
                if (nextElement !== 'body') {
                  const elementExists = document.querySelector(nextElement);
                  if (!elementExists) {
                    console.warn(`⚠️ Element "${nextElement}" not found for step ${nextIndex + 1}`);
                  }
                }
              }
            }

            // ✅ CRITICAL: Call moveNext() to progress to next step
            if (driverRef.current) {
              console.log(`✅ Moving to step ${nextIndex + 1}`);
              driverRef.current.moveNext();
            }
          } finally {
            // Re-enable buttons
            if (nextButton) {
              nextButton.disabled = false;
              nextButton.textContent = originalNextText || 'Next';
            }
            if (prevButton) prevButton.disabled = false;
            if (closeButton) closeButton.disabled = false;
          }
        },
        
        onPrevClick: (element, step) => {
          const currentIndex = driverRef.current?.getActiveIndex() ?? 0;
          console.log(`◀️ Previous button clicked - moving from step ${currentIndex + 1} to ${currentIndex}`);

          // Move to previous step
          if (driverRef.current) {
            driverRef.current.movePrevious();
          }
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
            console.log(`📍 Page: ${location.pathname}, Element: ${step.element}`);

            // Validate element exists
            const targetElement = step.element === 'body' ? document.body : document.querySelector(step.element);
            if (!targetElement) {
              console.warn(`⚠️ Target element not found: ${step.element}`);

              // P1 FIX: Skip to next step if critical element is missing
              if (currentStepData?.requiresNavigation || currentStepData?.waitForElement) {
                console.error(`❌ Critical element missing, auto-advancing to next step in 2 seconds`);
                setTimeout(() => {
                  if (driverRef.current && isActive) {
                    driverRef.current.moveNext();
                  }
                }, 2000);
                return; // Exit early
              }
            } else {
              console.log(`✅ Element found and ready for highlighting`);
            }

            // P1 FIX: Scroll expanded vendor content into view for navigate-to-vendors step
            if (currentStepData?.id === 'navigate-to-vendors' && targetElement) {
              // Wait for vendor card expansion animation to complete
              setTimeout(async () => {
                const brandsContainer = document.querySelector('[data-demo="vendor-card"] .bg-gray-50');
                if (brandsContainer) {
                  console.log('📜 Scrolling expanded vendor brands into view');
                  brandsContainer.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                  });
                }
              }, 800); // Wait for expansion (600ms) + animation (200ms)
            }

            // 🆕 NEW: Execute automated action if defined
            if (currentStepData?.automatedAction) {
              console.log(`🤖 Step has automated action: ${currentStepData.automatedAction.type}`);

              // Use the step's element as selector if not explicitly provided
              const actionSelector = currentStepData.automatedAction.selector || currentStepData.element;

              try {
                await demoController.executeAutomatedAction(
                  currentStepData.automatedAction,
                  actionSelector
                );

                // 🆕 NEW: Auto-advance to next step after action completes
                const advanceDelay = currentStepData.autoAdvanceDelay ?? 2500; // Default 2.5s
                console.log(`⏭️ Auto-advancing to next step in ${advanceDelay}ms`);

                setTimeout(() => {
                  if (driverRef.current && isActive) {
                    console.log(`▶️ Moving to next step automatically`);
                    driverRef.current.moveNext();
                  }
                }, advanceDelay);
              } catch (error) {
                console.error(`❌ Error executing automated action:`, error);
              }
            }

            // Handle tab clicks if specified (for within-page navigation)
            if (currentStepData?.tabToClick) {
              setTimeout(() => {
                console.log(`🖱️ Auto-clicking tab: ${currentStepData.tabToClick}`);
                demoController.clickTab(currentStepData.tabToClick!);
              }, 500);
            }

            // Create spotlight effect (disabled for now due to selector conflicts)
            // Driver.js already provides highlighting, so spotlight is redundant
            // if (targetElement) {
            //   demoController.createSpotlight(step.element);
            // }
          } catch (error) {
            console.error('❌ Error in onHighlightStarted:', error);
          }
        },

        // Remove custom popover rendering for now to fix the error
        // We'll use Driver.js built-in popover system

        steps: demoSteps.map((step, index) => {
          const element = step.element || 'body';

          // For steps requiring navigation, use body as temporary element
          // The real element will be highlighted after navigation in onNextClick
          const safeElement = step.requiresNavigation && step.page !== location.pathname
            ? 'body'
            : element;

          console.log(`🔧 Configuring step ${index + 1}:`, {
            id: step.id,
            element: safeElement,
            requiresNav: step.requiresNavigation,
            targetPage: step.page
          });

          return {
            element: safeElement,
            popover: {
              title: step.popover?.title || `Step ${index + 1}`,
              description: step.popover?.description || 'Demo step description',
              side: step.popover?.side || 'bottom',
              align: step.popover?.align || 'center'
            }
          };
        })
      };

      // Validate steps configuration before starting
      const validateSteps = (): boolean => {
        console.log('🔍 Validating demo steps configuration...');
        let isValid = true;

        demoSteps.forEach((step, index) => {
          // Check for required fields
          if (!step.id) {
            console.error(`❌ Step ${index + 1} missing required 'id' field`);
            isValid = false;
          }
          if (!step.page) {
            console.error(`❌ Step ${index + 1} missing required 'page' field`);
            isValid = false;
          }
          if (!step.popover) {
            console.error(`❌ Step ${index + 1} missing required 'popover' field`);
            isValid = false;
          }

          // Check for navigation steps without elements
          if (step.requiresNavigation && !step.element && step.element !== 'body') {
            console.warn(`⚠️ Step ${index + 1} (${step.id}) requires navigation but has no target element`);
          }

          // Check for elements that should exist on current page
          if (!step.requiresNavigation && step.page === location.pathname && step.element && step.element !== 'body') {
            const exists = document.querySelector(step.element);
            if (!exists) {
              console.warn(`⚠️ Step ${index + 1} (${step.id}) element not found on current page: ${step.element}`);
            }
          }
        });

        if (isValid) {
          console.log(`✅ All ${demoSteps.length} steps validated successfully`);
        } else {
          console.error(`❌ Step validation failed - demo may not work correctly`);
        }

        return isValid;
      };

      // Validate before starting
      validateSteps();

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