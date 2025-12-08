import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Edit2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { usePracticeProfile } from '../../contexts/PracticeProfileContext';
import {
  PRACTICE_TYPE_LABELS,
  PRACTICE_SPECIALTY_LABELS,
  PATIENT_VOLUME_LABELS,
  FRAME_PRICE_LABELS,
  PRIMARY_GOAL_LABELS,
} from '../../types/practiceProfile';
import { PracticeQuestionnaire } from '../questionnaire';
import toast from 'react-hot-toast';

export const PracticeProfileSection: React.FC = () => {
  const { profile, isCompleted, loading, refreshProfile } = usePracticeProfile();
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditComplete = () => {
    setShowEditModal(false);
    refreshProfile();
  };

  const handleEditSkip = () => {
    setShowEditModal(false);
    toast.info('Profile update cancelled');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isCompleted || !profile) {
    return (
      <div className="space-y-6">
        <Card variant="bordered" className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Practice Profile Incomplete
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Complete your practice profile to unlock personalized recommendations, insights, and a better overall experience.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowEditModal(true)}
                icon={<Stethoscope className="h-4 w-4" />}
                iconPosition="left"
              >
                Complete Profile Now
              </Button>
            </div>
          </div>
        </Card>

        {/* Modal for editing/completing */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1F2623] rounded-xl shadow-2xl"
            >
              <div className="p-8">
                <PracticeQuestionnaire
                  onComplete={handleEditComplete}
                  onSkip={handleEditSkip}
                />
              </div>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Completion Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            Profile Complete
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowEditModal(true)}
          icon={<Edit2 className="h-4 w-4" />}
          iconPosition="left"
        >
          Edit Profile
        </Button>
      </div>

      {/* Practice Information */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Stethoscope className="h-5 w-5" />
            <span>Practice Information</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Practice Type</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {profile.practice_type ? PRACTICE_TYPE_LABELS[profile.practice_type] : 'Not specified'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Specialty</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {profile.practice_specialty ? PRACTICE_SPECIALTY_LABELS[profile.practice_specialty] : 'Not specified'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Years in Business</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {profile.years_in_business || 'Not specified'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monthly Patient Volume</p>
              <p className="text-base font-medium text-gray-900 dark:text-white">
                {profile.patient_volume_range ? PATIENT_VOLUME_LABELS[profile.patient_volume_range] : 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Vendors & Pricing */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Vendors & Pricing
          </h3>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Vendors</p>
            {profile.current_brands.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.current_brands.map((vendor) => (
                  <span
                    key={vendor}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
                  >
                    {vendor}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-base text-gray-500 dark:text-gray-400">No vendors specified</p>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average Frame Price Range</p>
            <p className="text-base font-medium text-gray-900 dark:text-white">
              {profile.average_frame_price_range ? FRAME_PRICE_LABELS[profile.average_frame_price_range] : 'Not specified'}
            </p>
          </div>
        </div>
      </Card>

      {/* Goals */}
      <Card>
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Primary Goals
          </h3>

          {profile.primary_goals.length > 0 ? (
            <ul className="space-y-2">
              {profile.primary_goals.map((goal) => (
                <li key={goal} className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <span className="text-base text-gray-900 dark:text-white">
                    {PRIMARY_GOAL_LABELS[goal]}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-gray-500 dark:text-gray-400">No goals specified</p>
          )}
        </div>
      </Card>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1F2623] rounded-xl shadow-2xl"
          >
            <div className="p-8">
              <PracticeQuestionnaire
                onComplete={handleEditComplete}
                onSkip={handleEditSkip}
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
