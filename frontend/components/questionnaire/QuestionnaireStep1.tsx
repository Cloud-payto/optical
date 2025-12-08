import React from 'react';
import { Building2, Users, Calendar } from 'lucide-react';
import type { QuestionnaireStepProps } from '../../types/practiceProfile';
import {
  PRACTICE_TYPE_LABELS,
  PRACTICE_SPECIALTY_LABELS,
  PATIENT_VOLUME_LABELS,
} from '../../types/practiceProfile';

export const QuestionnaireStep1: React.FC<QuestionnaireStepProps> = ({
  formData,
  onChange,
  errors,
  onBlur,
  touched,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Tell us about your practice
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us personalize your experience
        </p>
      </div>

      {/* Practice Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Practice Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(PRACTICE_TYPE_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('practice_type', value)}
              onBlur={() => onBlur('practice_type')}
              className={`p-4 border-2 rounded-lg text-left transition-all ${
                formData.practice_type === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Building2 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">{label}</span>
              </div>
            </button>
          ))}
        </div>
        {touched.practice_type && errors.practice_type && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.practice_type}</p>
        )}
      </div>

      {/* Practice Specialty */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Practice Specialty *
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(PRACTICE_SPECIALTY_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('practice_specialty', value)}
              onBlur={() => onBlur('practice_specialty')}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                formData.practice_specialty === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <span className="font-medium text-gray-900 dark:text-white">{label}</span>
            </button>
          ))}
        </div>
        {touched.practice_specialty && errors.practice_specialty && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.practice_specialty}</p>
        )}
      </div>

      {/* Years in Business */}
      <div>
        <label htmlFor="years_in_business" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Years in Business *
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            id="years_in_business"
            name="years_in_business"
            type="number"
            min="0"
            max="100"
            value={formData.years_in_business}
            onChange={(e) => onChange('years_in_business', e.target.value)}
            onBlur={() => onBlur('years_in_business')}
            className={`block w-full pl-10 pr-3 py-2.5 border ${
              touched.years_in_business && errors.years_in_business
                ? 'border-red-500'
                : 'border-gray-300 dark:border-gray-600'
            } rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            placeholder="e.g., 5"
          />
        </div>
        {touched.years_in_business && errors.years_in_business && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.years_in_business}</p>
        )}
      </div>

      {/* Patient Volume */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Monthly Patient Volume *
        </label>
        <div className="space-y-2">
          {Object.entries(PATIENT_VOLUME_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('patient_volume_range', value)}
              onBlur={() => onBlur('patient_volume_range')}
              className={`w-full p-3 border-2 rounded-lg text-left transition-all flex items-center justify-between ${
                formData.patient_volume_range === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">{label}</span>
              </div>
              {formData.patient_volume_range === value && (
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              )}
            </button>
          ))}
        </div>
        {touched.patient_volume_range && errors.patient_volume_range && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.patient_volume_range}</p>
        )}
      </div>
    </div>
  );
};
