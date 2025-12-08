import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface QuestionnaireProgressProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export const QuestionnaireProgress: React.FC<QuestionnaireProgressProps> = ({
  currentStep,
  totalSteps,
  stepLabels,
}) => {
  return (
    <div className="w-full mb-8">
      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between items-center">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1">
              <div className="relative">
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center"
                  >
                    <CheckCircle className="h-6 w-6 text-white" />
                  </motion.div>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {stepNumber}
                  </div>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center ${
                  isCurrent || isCompleted
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
