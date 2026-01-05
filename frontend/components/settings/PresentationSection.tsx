import React from 'react';
import { EyeOff, Eye, User, Hash, FileText } from 'lucide-react';
import { usePresentationMode } from '../../contexts/PresentationModeContext';
import { motion } from 'framer-motion';

export const PresentationSection: React.FC = () => {
  const { isPresentationMode, togglePresentationMode } = usePresentationMode();

  const hiddenItems = [
    {
      icon: Hash,
      label: 'Account Numbers',
      description: 'Vendor account numbers and references',
    },
    {
      icon: User,
      label: 'Customer Names',
      description: 'Customer and business names from orders',
    },
    {
      icon: FileText,
      label: 'Order Numbers',
      description: 'Order reference numbers',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Presentation Mode
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Hide sensitive information when recording demos or sharing your screen
        </p>
      </div>

      {/* Main Toggle */}
      <motion.button
        onClick={togglePresentationMode}
        className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
          isPresentationMode
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center space-x-4">
          <div
            className={`p-2.5 rounded-lg ${
              isPresentationMode
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            {isPresentationMode ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </div>
          <div className="text-left">
            <div
              className={`font-medium ${
                isPresentationMode
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {isPresentationMode ? 'Presentation Mode Active' : 'Enable Presentation Mode'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {isPresentationMode
                ? 'Sensitive information is currently hidden'
                : 'Click to blur sensitive data for demos'}
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <div
          className={`relative w-12 h-6 rounded-full transition-colors ${
            isPresentationMode ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <motion.div
            className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
            animate={{ left: isPresentationMode ? '26px' : '2px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
      </motion.button>

      {/* What gets hidden */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          What gets hidden:
        </h4>
        <div className="grid gap-2">
          {hiddenItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                  isPresentationMode
                    ? 'bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800'
                    : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <div
                  className={`p-1.5 rounded ${
                    isPresentationMode
                      ? 'bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div
                    className={`text-sm font-medium ${
                      isPresentationMode
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {item.description}
                  </div>
                </div>
                {isPresentationMode && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="ml-auto"
                  >
                    <div className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-800 text-purple-600 dark:text-purple-300">
                      Hidden
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      {isPresentationMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center space-x-2 mb-2">
            <EyeOff className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Preview
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Sensitive text will appear like this:{' '}
            <span
              style={{
                filter: 'blur(5px)',
                userSelect: 'none',
              }}
              className="inline-block"
            >
              ACCT-12345
            </span>
          </div>
        </motion.div>
      )}

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Presentation mode is temporary and will reset when you close your browser.
          Perfect for recording Loom videos or screen sharing.
        </p>
      </div>
    </div>
  );
};
