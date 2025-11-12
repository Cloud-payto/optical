import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Eye, Building2, Package, Edit3, Percent, Plus } from 'lucide-react';
import { Company } from '../../types';

interface CompanyCardProps {
  company: Company;
  onViewBrandDetails: (companyId: string, brandId: string) => void;
  onEditCompany: (companyId: string) => void;
  isDemo?: boolean;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, onViewBrandDetails, onEditCompany, isDemo }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [demoLocked, setDemoLocked] = useState(false); // Prevent toggling during demo

  // Auto-expand when in demo mode and KEEP IT EXPANDED
  useEffect(() => {
    if (isDemo) {
      console.log('🎭 CompanyCard: Auto-expanding in demo mode for', company.name);

      // Set demo lock immediately to prevent race conditions
      setDemoLocked(true);

      // Expand after a short delay to ensure page is rendered
      const expandTimer = setTimeout(() => {
        setIsExpanded(true);
        console.log('✅ CompanyCard: Expansion complete for', company.name);
      }, 600); // Optimized timing - 600ms balances page load and Driver.js coordination

      return () => {
        clearTimeout(expandTimer);
      };
    } else {
      // Reset lock when exiting demo mode
      setDemoLocked(false);
    }
  }, [isDemo, company.name]);

  const toggleExpanded = () => {
    // Prevent toggling if demo is active and card is locked
    if (demoLocked) {
      console.log('🔒 CompanyCard: Toggle blocked during demo mode');
      return;
    }
    setIsExpanded(!isExpanded);
  };

  // Calculate discount percentage
  const calculateDiscountPercentage = (wholesale: number, yourCost: number): number => {
    if (wholesale <= 0 || yourCost >= wholesale) return 0;
    return Math.round(((wholesale - yourCost) / wholesale) * 100);
  };

  const handleEditCompany = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent expanding the card
    onEditCompany(company.id);
  };

  return (
    <div
      className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 hover:shadow-md"
      data-demo="vendor-card"
      data-tour="vendor-card"
    >
      {/* Company Header - Clickable */}
      <div className="relative">
        <button
          data-demo="vendor-expand-btn"
          onClick={toggleExpanded}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-2">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{company.name}</h3>
                {company.accountNumber && (
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">(#{company.accountNumber})</span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {company.brands.length} {company.brands.length === 1 ? 'brand' : 'brands'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </motion.div>
          </div>
        </button>

        {/* Edit button positioned absolutely to avoid nesting */}
        <button
          onClick={handleEditCompany}
          className="absolute top-6 right-12 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors z-10"
          title="Edit company details"
          data-demo="edit-vendor-btn"
          data-tour="edit-vendor-btn"
        >
          <Edit3 className="h-4 w-4 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              duration: isDemo ? 0.2 : 0.3, // Faster animation in demo mode
              ease: 'easeInOut'
            }}
            className="border-t border-gray-100 dark:border-gray-700"
          >
            <div className="p-6 bg-gray-50 dark:bg-[#181F1C]">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Brands
                  </h4>
                  <button
                    onClick={handleEditCompany}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors duration-200"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Brand
                  </button>
                </div>
                {company.brands.map((brand) => {
                  const discountPercentage = brand.wholesaleCost && brand.yourCost
                    ? calculateDiscountPercentage(brand.wholesaleCost, brand.yourCost)
                    : 0;

                  return (
                    <div
                      key={brand.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-[#1F2623] rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900 dark:text-white">{brand.name}</h5>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Wholesale: {brand.wholesaleCost && brand.wholesaleCost > 0
                              ? `$${brand.wholesaleCost.toFixed(2)}`
                              : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Your Cost: {brand.yourCost && brand.yourCost > 0
                              ? `$${brand.yourCost.toFixed(2)}`
                              : 'N/A'}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                            Retail Price (MSRP): {brand.retailPrice && brand.retailPrice > 0
                              ? `$${brand.retailPrice.toFixed(2)}`
                              : 'N/A'}
                          </p>
                          {discountPercentage > 0 && (
                            <div className="flex items-center space-x-1">
                              <Percent className="h-3 w-3 text-green-600 dark:text-green-400" />
                              <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                {discountPercentage}% discount
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        data-demo="view-brand-details-btn"
                        onClick={() => onViewBrandDetails(company.id, brand.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors duration-200"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View Details
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompanyCard;