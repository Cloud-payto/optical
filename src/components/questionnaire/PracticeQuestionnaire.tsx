import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { QuestionnaireProgress } from './QuestionnaireProgress';
import { QuestionnaireStep1 } from './QuestionnaireStep1';
import { QuestionnaireStep2 } from './QuestionnaireStep2';
import { QuestionnaireStep3 } from './QuestionnaireStep3';
import { usePracticeProfile } from '../../contexts/PracticeProfileContext';
import type { PracticeProfileFormData } from '../../types/practiceProfile';
import toast from 'react-hot-toast';

interface PracticeQuestionnaireProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const STEP_LABELS = ['Practice Info', 'Vendors & Pricing', 'Goals'];

export const PracticeQuestionnaire: React.FC<PracticeQuestionnaireProps> = ({
  onComplete,
  onSkip,
}) => {
  const { saveProfile } = usePracticeProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<PracticeProfileFormData>({
    practice_type: '',
    practice_specialty: '',
    years_in_business: '',
    patient_volume_range: '',
    current_brands: [],
    average_frame_price_range: '',
    primary_goals: [],
  });

  const [errors, setErrors] = useState<Partial<Record<keyof PracticeProfileFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof PracticeProfileFormData, boolean>>>({});

  const handleChange = (field: keyof PracticeProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof PracticeProfileFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof PracticeProfileFormData, string>> = {};

    if (step === 1) {
      if (!formData.practice_type) {
        newErrors.practice_type = 'Please select a practice type';
      }
      if (!formData.practice_specialty) {
        newErrors.practice_specialty = 'Please select a specialty';
      }
      if (!formData.years_in_business || parseInt(formData.years_in_business) < 0) {
        newErrors.years_in_business = 'Please enter years in business';
      }
      if (!formData.patient_volume_range) {
        newErrors.patient_volume_range = 'Please select patient volume';
      }
    }

    if (step === 2) {
      if (!formData.average_frame_price_range) {
        newErrors.average_frame_price_range = 'Please select a price range';
      }
      // current_brands is optional, no validation needed
    }

    if (step === 3) {
      if (formData.primary_goals.length === 0) {
        newErrors.primary_goals = 'Please select at least one goal';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Mark current step fields as touched
    if (currentStep === 1) {
      setTouched({
        practice_type: true,
        practice_specialty: true,
        years_in_business: true,
        patient_volume_range: true,
      });
    } else if (currentStep === 2) {
      setTouched((prev) => ({
        ...prev,
        average_frame_price_range: true,
      }));
    } else if (currentStep === 3) {
      setTouched((prev) => ({
        ...prev,
        primary_goals: true,
      }));
    }

    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      return;
    }

    try {
      setIsSubmitting(true);

      const profileData = {
        practice_type: formData.practice_type || null,
        practice_specialty: formData.practice_specialty || null,
        years_in_business: formData.years_in_business ? parseInt(formData.years_in_business) : null,
        patient_volume_range: formData.patient_volume_range || null,
        current_brands: formData.current_brands,
        average_frame_price_range: formData.average_frame_price_range || null,
        primary_goals: formData.primary_goals,
      };

      await saveProfile(profileData);

      toast.success('Profile completed! Let\'s get started!', {
        icon: '🎉',
        duration: 4000,
      });

      onComplete();
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Error toast is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = {
    formData,
    onChange: handleChange,
    errors,
    onBlur: handleBlur,
    touched,
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Card className="p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Complete Your Profile
            </h1>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400">
            Help us personalize your OptiProfit experience
          </p>
        </div>

        {/* Progress */}
        <QuestionnaireProgress
          currentStep={currentStep}
          totalSteps={3}
          stepLabels={STEP_LABELS}
        />

        {/* Steps */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && <QuestionnaireStep1 {...stepProps} />}
            {currentStep === 2 && <QuestionnaireStep2 {...stepProps} />}
            {currentStep === 3 && <QuestionnaireStep3 {...stepProps} />}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
                icon={<ArrowLeft className="h-4 w-4" />}
                iconPosition="left"
              >
                Previous
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {onSkip && (
              <Button
                type="button"
                variant="ghost"
                onClick={onSkip}
                disabled={isSubmitting}
              >
                Skip for Now
              </Button>
            )}

            <Button
              type="button"
              variant="primary"
              onClick={handleNext}
              disabled={isSubmitting}
              isLoading={isSubmitting}
              icon={
                currentStep === 3 ? (
                  <Sparkles className="h-4 w-4" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )
              }
              iconPosition="right"
            >
              {isSubmitting ? 'Saving...' : currentStep === 3 ? 'Complete Profile' : 'Next'}
            </Button>
          </div>
        </div>

        {/* Optional note */}
        <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
          You can update this information anytime in your account settings
        </p>
      </Card>
    </div>
  );
};
