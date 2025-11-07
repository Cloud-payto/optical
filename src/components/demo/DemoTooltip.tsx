import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, SkipForward } from 'lucide-react';

interface DemoTooltipProps {
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const DemoTooltip: React.FC<DemoTooltipProps> = ({
  title,
  description,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  canGoNext,
  canGoPrevious,
  position = 'bottom'
}) => {
  const progress = ((currentStep - 1) / totalSteps) * 100;

  // Animation variants based on position
  const getAnimationVariants = () => {
    const baseVariants = {
      initial: { opacity: 0, scale: 0.9 },
      animate: { 
        opacity: 1, 
        scale: 1,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 25
        }
      },
      exit: { 
        opacity: 0, 
        scale: 0.9,
        transition: {
          duration: 0.2,
          ease: 'easeOut'
        }
      }
    };

    // Add position-specific entry animation
    switch (position) {
      case 'top':
        return {
          ...baseVariants,
          initial: { ...baseVariants.initial, y: 10 },
          animate: { ...baseVariants.animate, y: 0 }
        };
      case 'bottom':
        return {
          ...baseVariants,
          initial: { ...baseVariants.initial, y: -10 },
          animate: { ...baseVariants.animate, y: 0 }
        };
      case 'left':
        return {
          ...baseVariants,
          initial: { ...baseVariants.initial, x: 10 },
          animate: { ...baseVariants.animate, x: 0 }
        };
      case 'right':
        return {
          ...baseVariants,
          initial: { ...baseVariants.initial, x: -10 },
          animate: { ...baseVariants.animate, x: 0 }
        };
      default:
        return baseVariants;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        variants={getAnimationVariants()}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 max-w-sm mx-auto"
        style={{ zIndex: 10001 }}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-500">
              Step {currentStep} of {totalSteps}
            </span>
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              title="Skip Demo"
            >
              <SkipForward className="w-3 h-3" />
            </button>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <div
            className="text-sm text-gray-600 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <motion.button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${canGoPrevious 
                ? 'text-gray-700 hover:bg-gray-100 hover:text-gray-900' 
                : 'text-gray-400 cursor-not-allowed'
              }
            `}
            whileHover={canGoPrevious ? { scale: 1.02 } : {}}
            whileTap={canGoPrevious ? { scale: 0.98 } : {}}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </motion.button>

          <div className="flex gap-2">
            <motion.button
              onClick={onSkip}
              className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Skip Demo
            </motion.button>

            <motion.button
              onClick={onNext}
              disabled={!canGoNext}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${canGoNext
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
              whileHover={canGoNext ? { scale: 1.02 } : {}}
              whileTap={canGoNext ? { scale: 0.98 } : {}}
            >
              {currentStep === totalSteps ? 'Complete' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Keyboard Hints */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 text-center">
            Use arrow keys to navigate • ESC to exit
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DemoTooltip;