import React, { useState, useEffect } from 'react';
import { DollarSign, Tag, X } from 'lucide-react';
import type { QuestionnaireStepProps } from '../../types/practiceProfile';
import { FRAME_PRICE_LABELS } from '../../types/practiceProfile';
import { fetchVendors } from '../../services/api';
import toast from 'react-hot-toast';

export const QuestionnaireStep2: React.FC<QuestionnaireStepProps> = ({
  formData,
  onChange,
  errors,
  onBlur,
  touched,
}) => {
  const [allVendors, setAllVendors] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const vendors = await fetchVendors();
      const vendorNames = vendors.map((v) => v.name).sort();
      setAllVendors(vendorNames);
    } catch (error) {
      console.error('Failed to load vendors:', error);
      toast.error('Failed to load vendors list');
    } finally {
      setLoading(false);
    }
  };

  const filteredVendors = allVendors.filter(
    (vendor) =>
      vendor.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !formData.current_brands.includes(vendor)
  );

  const addVendor = (vendor: string) => {
    if (!formData.current_brands.includes(vendor)) {
      onChange('current_brands', [...formData.current_brands, vendor]);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const removeVendor = (vendor: string) => {
    onChange(
      'current_brands',
      formData.current_brands.filter((v) => v !== vendor)
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Vendors & Pricing
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Help us understand your supplier preferences
        </p>
      </div>

      {/* Current Vendors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Vendors You Work With
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Select the vendors you currently order from (optional, but helps with recommendations)
        </p>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Tag className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            placeholder="Search for vendors..."
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1F2623] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />

          {/* Dropdown */}
          {showDropdown && searchTerm && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#1F2623] border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Loading vendors...
                </div>
              ) : filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <button
                    key={vendor}
                    type="button"
                    onClick={() => addVendor(vendor)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                  >
                    {vendor}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No vendors found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Vendors */}
        {formData.current_brands.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {formData.current_brands.map((vendor) => (
              <div
                key={vendor}
                className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 rounded-full text-sm"
              >
                <span>{vendor}</span>
                <button
                  type="button"
                  onClick={() => removeVendor(vendor)}
                  className="hover:text-blue-900 dark:hover:text-blue-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Selected {formData.current_brands.length} vendor{formData.current_brands.length !== 1 ? 's' : ''}
        </p>

        {touched.current_brands && errors.current_brands && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.current_brands}</p>
        )}
      </div>

      {/* Average Frame Price Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Average Retail Frame Price *
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          What's your typical frame price point?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(FRAME_PRICE_LABELS).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange('average_frame_price_range', value)}
              onBlur={() => onBlur('average_frame_price_range')}
              className={`p-4 border-2 rounded-lg text-center transition-all ${
                formData.average_frame_price_range === value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-400'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400 mx-auto mb-1" />
              <span className="font-medium text-gray-900 dark:text-white">{label}</span>
            </button>
          ))}
        </div>
        {touched.average_frame_price_range && errors.average_frame_price_range && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.average_frame_price_range}</p>
        )}
      </div>
    </div>
  );
};
