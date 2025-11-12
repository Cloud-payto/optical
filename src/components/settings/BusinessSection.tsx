import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, MapPin, Edit2, Check, X } from 'lucide-react';
import { validateZipCode, validateStateCode } from '../../utils/validation';
import toast from 'react-hot-toast';
import { updateAccount } from '../../services/api';

interface BusinessSectionProps {
  profile: {
    businessName?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  onUpdate: () => void;
}

export const BusinessSection: React.FC<BusinessSectionProps> = ({ profile, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    businessName: profile.businessName || '',
    address: profile.address || '',
    city: profile.city || '',
    state: profile.state || '',
    zipCode: profile.zipCode || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({
      businessName: profile.businessName || '',
      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      zipCode: profile.zipCode || '',
    });
    setErrors({});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      businessName: profile.businessName || '',
      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      zipCode: profile.zipCode || '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.zipCode) {
      const zipValidation = validateZipCode(formData.zipCode);
      if (!zipValidation.isValid) {
        newErrors.zipCode = zipValidation.error!;
      }
    }

    if (formData.state) {
      const stateValidation = validateStateCode(formData.state);
      if (!stateValidation.isValid) {
        newErrors.state = stateValidation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setIsSaving(true);

    try {
      await updateAccount({
        businessName: formData.businessName || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state ? formData.state.toUpperCase() : undefined,
        zipCode: formData.zipCode || undefined,
      });

      toast.success('Business information updated successfully!');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update business info:', error);
      toast.error('Failed to update business information');
    } finally {
      setIsSaving(false);
    }
  };

  const InfoDisplay = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        <span className="text-gray-900 dark:text-white">{value || 'Not set'}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Business Information
        </h3>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            <span>Edit</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Business Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Business Name
          </label>
          {isEditing ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Your Business Name"
              />
            </div>
          ) : (
            <InfoDisplay icon={Building2} label="" value={profile.businessName} />
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Street Address
          </label>
          {isEditing ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="123 Main Street"
              />
            </div>
          ) : (
            <InfoDisplay icon={MapPin} label="" value={profile.address} />
          )}
        </div>

        {/* City, State, Zip in a row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="City"
              />
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-gray-900 dark:text-white">{profile.city || 'Not set'}</span>
              </div>
            )}
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  maxLength={2}
                  className={`block w-full px-3 py-2.5 border ${
                    errors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors uppercase`}
                  placeholder="CA"
                />
                {errors.state && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.state}</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-gray-900 dark:text-white">{profile.state || 'Not set'}</span>
              </div>
            )}
          </div>

          {/* Zip Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Zip Code
            </label>
            {isEditing ? (
              <div>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  className={`block w-full px-3 py-2.5 border ${
                    errors.zipCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                  placeholder="12345"
                />
                {errors.zipCode && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.zipCode}</p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="text-gray-900 dark:text-white">{profile.zipCode || 'Not set'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
