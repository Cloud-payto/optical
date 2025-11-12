import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PracticeQuestionnaire } from '../components/questionnaire';
import { markQuestionnaireSkipped } from '../services/api';
import toast from 'react-hot-toast';

export default function QuestionnairePage() {
  const navigate = useNavigate();

  const handleComplete = () => {
    // Navigate to dashboard after completion
    navigate('/dashboard');
  };

  const handleSkip = async () => {
    try {
      await markQuestionnaireSkipped();
      toast.success('You can complete your profile anytime from settings');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to mark questionnaire as skipped:', error);
      // Still navigate even if marking as skipped fails
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-[#181F1C] dark:to-blue-950/30 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <PracticeQuestionnaire onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  );
}
