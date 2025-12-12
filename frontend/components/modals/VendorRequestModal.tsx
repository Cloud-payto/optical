import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, Send, AlertCircle, Building2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getApiEndpoint } from '../../lib/api-config';

interface VendorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorRequestModal: React.FC<VendorRequestModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [vendorName, setVendorName] = useState('');
  const [vendorWebsite, setVendorWebsite] = useState('');
  const [canProvideEmail, setCanProvideEmail] = useState<'yes' | 'no' | ''>('');
  const [emailCount, setEmailCount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorName.trim() || !canProvideEmail) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!user?.id) {
      toast.error('You must be logged in to submit a vendor request');
      return;
    }

    setIsSubmitting(true);

    // Build reason string from email availability
    const reason = canProvideEmail === 'yes'
      ? `Can provide vendor confirmation email(s): ${emailCount || '1'} sample(s) available`
      : 'Cannot provide vendor confirmation email at this time';

    try {
      const response = await fetch(getApiEndpoint('/feedback/vendor-request'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorName: vendorName.trim(),
          vendorWebsite: vendorWebsite.trim() || null,
          reason: reason,
          userId: user.id,
          userEmail: user.email || 'unknown@email.com',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vendor request');
      }

      toast.success('Vendor request submitted successfully! We\'ll review it soon.');
      setVendorName('');
      setVendorWebsite('');
      setCanProvideEmail('');
      setEmailCount('');
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit vendor request';
      toast.error(errorMessage);
      console.error('Error submitting vendor request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#1F2623] rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Request a Vendor</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  Don't see your vendor in our system? Let us know which vendor you'd like us to add!
                </p>
              </div>

              <div>
                <label htmlFor="vendor-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    id="vendor-name"
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g., Acme Eyewear Co."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vendor-website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vendor Website <span className="text-gray-400 dark:text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  id="vendor-website"
                  type="url"
                  value={vendorWebsite}
                  onChange={(e) => setVendorWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Can you provide us with a Vendor Order Confirmation email? <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setCanProvideEmail('yes')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all flex items-center justify-center space-x-2 ${
                      canProvideEmail === 'yes'
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <Mail className="h-4 w-4" />
                    <span>Yes, I can</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanProvideEmail('no')}
                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all ${
                      canProvideEmail === 'no'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                    }`}
                    disabled={isSubmitting}
                  >
                    <span>No, not yet</span>
                  </button>
                </div>
              </div>

              {canProvideEmail === 'yes' && (
                <div>
                  <label htmlFor="email-count" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    How many sample emails can you provide?
                  </label>
                  <input
                    id="email-count"
                    type="number"
                    min="1"
                    max="100"
                    value={emailCount}
                    onChange={(e) => setEmailCount(e.target.value)}
                    placeholder="e.g., 3"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    We'll reach out to you to collect the sample emails for parser development.
                  </p>
                </div>
              )}

              {canProvideEmail === 'no' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    No problem! We'll add this vendor to our wishlist. Having a sample order confirmation email helps us build the parser faster, so let us know if you get one in the future.
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 rounded-lg transition-all flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Request</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VendorRequestModal;
