import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Vendor {
  id: string;
  name: string;
  code?: string;
  domain?: string;
}

interface VendorSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  userId: string;
  onVendorAdded: () => void;
}

const VendorSuggestionModal: React.FC<VendorSuggestionModalProps> = ({
  isOpen,
  onClose,
  vendor,
  userId,
  onVendorAdded
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [neverShowAgain, setNeverShowAgain] = useState(false);

  const handleAddVendor = async () => {
    if (!vendor) return;

    setIsAdding(true);
    try {
      // Get all brands for this vendor
      const brandsResponse = await fetch(`/api/vendors/${vendor.id}/brands`);
      if (!brandsResponse.ok) throw new Error('Failed to fetch vendor brands');

      const brands = await brandsResponse.json();

      if (brands.length === 0) {
        toast.error('This vendor has no brands to add');
        setIsAdding(false);
        return;
      }

      // Add all brands for this vendor to the user's account
      const brandIds = brands.map((b: any) => b.id);

      const response = await fetch(`/api/vendors/account-brands/${userId}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId: vendor.id,
          brandIds: brandIds
        })
      });

      if (!response.ok) throw new Error('Failed to add vendor');

      const result = await response.json();

      toast.success(`Added ${vendor.name} with ${result.addedCount} brand${result.addedCount !== 1 ? 's' : ''}!`);

      // Store preference if user chose "Never show again"
      if (neverShowAgain) {
        const dismissedVendors = JSON.parse(localStorage.getItem('dismissedVendors') || '[]');
        dismissedVendors.push(vendor.id);
        localStorage.setItem('dismissedVendors', JSON.stringify(dismissedVendors));
      }

      onVendorAdded();
      onClose();
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast.error('Failed to add vendor. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDismiss = () => {
    if (neverShowAgain && vendor) {
      const dismissedVendors = JSON.parse(localStorage.getItem('dismissedVendors') || '[]');
      dismissedVendors.push(vendor.id);
      localStorage.setItem('dismissedVendors', JSON.stringify(dismissedVendors));
    }
    onClose();
  };

  if (!vendor) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">New Vendor Detected</h3>
                  <p className="text-sm text-gray-500">Add to your vendors?</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-900">
                      We detected a new vendor: <span className="font-semibold">{vendor.name}</span>
                    </p>
                    {vendor.domain && (
                      <p className="text-sm text-gray-600 mt-1">{vendor.domain}</p>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                Would you like to add this vendor to your account? This will add all associated brands with default pricing (45% discount, Net 30 terms).
              </p>

              {/* Never show again checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="neverShowAgain"
                  checked={neverShowAgain}
                  onChange={(e) => setNeverShowAgain(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="neverShowAgain" className="text-sm text-gray-700">
                  Don't ask me again for this vendor
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleDismiss}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isAdding}
              >
                Not Now
              </button>
              <button
                onClick={handleAddVendor}
                disabled={isAdding}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Add Vendor
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VendorSuggestionModal;
