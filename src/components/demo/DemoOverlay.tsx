import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemo } from '../../contexts/DemoContext';
import { X, ArrowLeft, ArrowRight, SkipForward, Loader2, MousePointerClick } from 'lucide-react';

const DemoOverlay: React.FC = () => {
  const {
    isDemo,
    currentStep,
    currentStepData,
    nextStep,
    prevStep,
    endDemo,
    totalSteps,
    waitingForUserAction
  } = useDemo();

  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  // Simple, reliable positioning calculation
  const calculatePosition = (element: HTMLElement, preferredPosition: string = 'bottom') => {
    const rect = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const gap = 12;
    
    let x = 0;
    let y = 0;
    let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
    
    // Check available space and choose best position
    const spaceTop = rect.top;
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = window.innerWidth - rect.right;
    
    // Prefer the requested position if there's enough space
    if (preferredPosition === 'bottom' && spaceBottom >= tooltipHeight + gap) {
      placement = 'bottom';
      x = rect.left + rect.width / 2 - tooltipWidth / 2;
      y = rect.bottom + gap;
    } else if (preferredPosition === 'top' && spaceTop >= tooltipHeight + gap) {
      placement = 'top';
      x = rect.left + rect.width / 2 - tooltipWidth / 2;
      y = rect.top - tooltipHeight - gap;
    } else if (preferredPosition === 'right' && spaceRight >= tooltipWidth + gap) {
      placement = 'right';
      x = rect.right + gap;
      y = rect.top + rect.height / 2 - tooltipHeight / 2;
    } else if (preferredPosition === 'left' && spaceLeft >= tooltipWidth + gap) {
      placement = 'left';
      x = rect.left - tooltipWidth - gap;
      y = rect.top + rect.height / 2 - tooltipHeight / 2;
    } else {
      // Fallback to position with most space
      if (spaceBottom >= spaceTop && spaceBottom >= spaceLeft && spaceBottom >= spaceRight) {
        placement = 'bottom';
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.bottom + gap;
      } else if (spaceTop >= spaceLeft && spaceTop >= spaceRight) {
        placement = 'top';
        x = rect.left + rect.width / 2 - tooltipWidth / 2;
        y = rect.top - tooltipHeight - gap;
      } else if (spaceRight >= spaceLeft) {
        placement = 'right';
        x = rect.right + gap;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
      } else {
        placement = 'left';
        x = rect.left - tooltipWidth - gap;
        y = rect.top + rect.height / 2 - tooltipHeight / 2;
      }
    }
    
    // Ensure tooltip stays within viewport
    x = Math.max(16, Math.min(x, window.innerWidth - tooltipWidth - 16));
    y = Math.max(16, Math.min(y, window.innerHeight - tooltipHeight - 16));
    
    return { x, y, placement };
  };

  // Find and position tooltip relative to target element
  useEffect(() => {
    if (!isDemo || !currentStepData) {
      setTargetElement(null);
      return;
    }

    const findAndPositionElement = () => {
      if (currentStepData.selector) {
        const element = document.querySelector(currentStepData.selector) as HTMLElement;
        if (element) {
          console.log('Found target element:', element, 'for selector:', currentStepData.selector);
          console.log('Element rect:', element.getBoundingClientRect());
          setTargetElement(element);
          
          const { x, y, placement } = calculatePosition(element, currentStepData.position || 'bottom');
          console.log('Calculated tooltip position:', { x, y, placement });
          setTooltipPosition({ x, y });
          setTooltipPlacement(placement);
          
          // Scroll element into view
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
          
          return true;
        } else {
          console.warn('Element not found for selector:', currentStepData.selector);
        }
      } else {
        setTargetElement(null);
        return true;
      }
      return false;
    };

    // Try immediately, then retry after delay if needed
    if (!findAndPositionElement()) {
      const timeout = setTimeout(() => {
        findAndPositionElement();
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isDemo, currentStepData]);

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (targetElement && currentStepData) {
        const { x, y, placement } = calculatePosition(targetElement, currentStepData.position || 'bottom');
        setTooltipPosition({ x, y });
        setTooltipPlacement(placement);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetElement, currentStepData]);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!isDemo) return;
    
    switch (e.key) {
      case 'ArrowRight':
      case ' ':
        e.preventDefault();
        nextStep();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        prevStep();
        break;
      case 'Escape':
        e.preventDefault();
        endDemo();
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isDemo, currentStep]);

  if (!isDemo || !currentStepData) return null;

  const isCenterPosition = !currentStepData.selector || currentStepData.position === 'center';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Dark overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-40"
        />
        
        {/* Highlight spotlight for specific elements */}
        {targetElement && !isCenterPosition && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              // Add pulsing animation for interactive steps
              ...(waitingForUserAction && {
                boxShadow: [
                  '0 0 0 0 rgba(59, 130, 246, 0.7)',
                  '0 0 0 10px rgba(59, 130, 246, 0)',
                  '0 0 0 0 rgba(59, 130, 246, 0)'
                ]
              })
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 0.3,
              ...(waitingForUserAction && {
                boxShadow: {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }
              })
            }}
            className={`absolute bg-white bg-opacity-10 rounded-lg shadow-xl pointer-events-none z-[45] ${
              waitingForUserAction
                ? 'border-4 border-blue-500'
                : 'border-2 border-blue-400'
            }`}
            style={{
              left: targetElement.getBoundingClientRect().left - 4,
              top: targetElement.getBoundingClientRect().top - 4,
              width: targetElement.getBoundingClientRect().width + 8,
              height: targetElement.getBoundingClientRect().height + 8,
            }}
          />
        )}
        
        {/* Demo tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ 
            duration: 0.4,
            ease: [0.4, 0.0, 0.2, 1]
          }}
          className={`pointer-events-auto z-50 ${
            isCenterPosition 
              ? 'fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2' 
              : 'absolute'
          }`}
          style={!isCenterPosition ? {
            left: tooltipPosition.x,
            top: tooltipPosition.y,
          } : {}}
        >
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-80 max-w-sm sm:max-w-md">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {currentStep + 1}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentStepData.title}
                </h3>
              </div>
              <button
                onClick={endDemo}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4">
              <p className="text-gray-700 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>
            
            {/* Progress bar */}
            <div className="px-4 pb-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Step {currentStep + 1} of {totalSteps}</span>
                <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
              </div>
            </div>
            
            {/* Controls */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200">
              <button
                onClick={prevStep}
                disabled={currentStep === 0 || waitingForUserAction}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Previous
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={endDemo}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip Demo
                </button>
              </div>

              {/* Show waiting state when user action required */}
              {waitingForUserAction ? (
                <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md">
                  <MousePointerClick className="w-4 h-4 mr-2 animate-pulse" />
                  Waiting for your action...
                </div>
              ) : (
                <button
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
                  {currentStep === totalSteps - 1 ? (
                    <SkipForward className="w-4 h-4 ml-1" />
                  ) : (
                    <ArrowRight className="w-4 h-4 ml-1" />
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Tooltip pointer for non-center positions */}
          {!isCenterPosition && targetElement && (
            <div
              className="absolute w-3 h-3 bg-white border border-gray-200 transform rotate-45"
              style={{
                ...(tooltipPlacement === 'top' && {
                  bottom: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                }),
                ...(tooltipPlacement === 'bottom' && {
                  top: '-6px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                }),
                ...(tooltipPlacement === 'left' && {
                  right: '-6px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(45deg)',
                }),
                ...(tooltipPlacement === 'right' && {
                  left: '-6px',
                  top: '50%',
                  transform: 'translateY(-50%) rotate(45deg)',
                }),
              }}
            />
          )}
        </motion.div>
        
        {/* Keyboard shortcuts hint */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <div className="bg-black bg-opacity-75 text-white text-xs px-3 py-2 rounded-lg">
            <div className="flex items-center space-x-4">
              <span>← → Navigate</span>
              <span>Space Next</span>
              <span>Esc Exit</span>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default DemoOverlay;