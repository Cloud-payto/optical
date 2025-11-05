import React, { useState } from 'react';
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

  const toggleExpanded = () => {
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
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md"
      data-demo={isDemo ? "vendor-card" : undefined}
      data-tour={isDemo ? "vendor-card" : undefined}
    >
      {/* Company Header - Clickable */}
      <div className="relative">
        <button
          onClick={toggleExpanded}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 rounded-lg p-2">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
              </div>
              <p className="text-sm text-gray-500">
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
          className="absolute top-6 right-12 p-1 hover:bg-gray-200 rounded transition-colors z-10"
          title="Edit company details"
          data-demo={isDemo ? "edit-vendor-btn" : undefined}
          data-tour={isDemo ? "edit-vendor-btn" : undefined}
        >
          <Edit3 className="h-4 w-4 text-gray-400 hover:text-blue-600" />
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-t border-gray-100"
          >
            <div className="p-6 bg-gray-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Brands
                  </h4>
                  <button
                    onClick={handleEditCompany}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors duration-200"
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
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex-1">
                        <h5 className="text-sm font-medium text-gray-900">{brand.name}</h5>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">
                            Wholesale: {brand.wholesaleCost && brand.wholesaleCost > 0
                              ? `$${brand.wholesaleCost.toFixed(2)}`
                              : 'N/A'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Your Cost: {brand.yourCost && brand.yourCost > 0
                              ? `$${brand.yourCost.toFixed(2)}`
                              : 'N/A'}
                          </p>
                          <p className="text-xs text-blue-600 font-medium">
                            Retail Price (MSRP): {brand.retailPrice && brand.retailPrice > 0
                              ? `$${brand.retailPrice.toFixed(2)}`
                              : 'N/A'}
                          </p>
                          {discountPercentage > 0 && (
                            <div className="flex items-center space-x-1">
                              <Percent className="h-3 w-3 text-green-600" />
                              <p className="text-xs font-medium text-green-600">
                                {discountPercentage}% discount
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onViewBrandDetails(company.id, brand.id)}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors duration-200"
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