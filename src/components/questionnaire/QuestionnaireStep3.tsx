import React from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import type { QuestionnaireStepProps, PrimaryGoal } from '../../types/practiceProfile';
import { PRIMARY_GOAL_LABELS, PRIMARY_GOAL_DESCRIPTIONS } from '../../types/practiceProfile';

export const QuestionnaireStep3: React.FC<QuestionnaireStepProps> = ({
  formData,
  onChange,
  errors,
  onBlur,
  touched,
}) => {
  const toggleGoal = (goal: PrimaryGoal) => {
    const currentGoals = formData.primary_goals;
    if (currentGoals.includes(goal)) {
      onChange(
        'primary_goals',
        currentGoals.filter((g) => g !== goal)
      );
    } else {
      onChange('primary_goals', [...currentGoals, goal]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Goals
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          What would you like to achieve with OptiProfit? (Select all that apply)
        </p>
      </div>

      {/* Primary Goals */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Primary Goals *
        </label>
        <div className="space-y-3">
          {Object.entries(PRIMARY_GOAL_LABELS).map(([value, label]) => {
            const isSelected = formData.primary_goals.includes(value as PrimaryGoal);
            const description = PRIMARY_GOAL_DESCRIPTIONS[value as PrimaryGoal];

            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleGoal(value as PrimaryGoal)}
                onBlur={() => onBlur('primary_goals')}
                className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {isSelected ? (
                      <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <div className="h-6 w-6 border-2 border-gray-300 dark:border-gray-600 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-900 dark:text-white">{label}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {touched.primary_goals && errors.primary_goals && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.primary_goals}</p>
        )}
      </div>

      {/* Summary */}
      {formData.primary_goals.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                Great! You've selected {formData.primary_goals.length} goal{formData.primary_goals.length !== 1 ? 's' : ''}
              </h4>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                We'll customize your experience to help you achieve these objectives.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
