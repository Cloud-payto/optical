import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, X, Send, AlertCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface VendorRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VendorRequestModal: React.FC<VendorRequestModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [vendorName, setVendorName] = useState('');
  const [vendorWebsite, setVendorWebsite] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vendorName.trim() || !reason.trim()) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement actual vendor request submission (e.g., send to backend API)
      // For now, we'll simulate a submission
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the vendor request (you can replace this with actual API call)
      console.log('Vendor Request Submitted:', {
        vendorName,
        vendorWebsite,
        reason,
        userEmail: user?.email,
        timestamp: new Date().toISOString(),
      });

      toast.success('Vendor request submitted successfully!');
      setVendorName('');
      setVendorWebsite('');
      setReason('');
      onClose();
    } catch (error) {
      toast.error('Failed to submit vendor request');
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
            className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
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
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-800">
                  Don't see your vendor in our system? Let us know which vendor you'd like us to add!
                </p>
              </div>

              <div>
                <label htmlFor="vendor-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="vendor-name"
                    type="text"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                    placeholder="e.g., Acme Eyewear Co."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="vendor-website" className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor Website <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  id="vendor-website"
                  type="url"
                  value={vendorWebsite}
                  onChange={(e) => setVendorWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="vendor-reason" className="block text-sm font-medium text-gray-700 mb-1">
                  Why do you need this vendor? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="vendor-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Tell us why this vendor would be helpful for your business..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
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
