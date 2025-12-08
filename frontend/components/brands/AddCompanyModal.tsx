import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Building2, User, Phone, Mail, Globe, Plus, Trash2, DollarSign } from 'lucide-react';
import { Company, Brand } from '../../types';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newCompany: Company) => void;
}

interface BrandFormData {
  id: string;
  name: string;
  wholesaleCost: number;
  yourCost: number;
  tariffTax: number;
  isTariffEnabled: boolean;
  notes: string;
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [companyName, setCompanyName] = useState('');
  const [contactInfo, setContactInfo] = useState({
    companyEmail: '',
    companyPhone: '',
    supportEmail: '',
    supportPhone: '',
    website: '',
    repName: '',
    repEmail: '',
    repPhone: ''
  });

  const [brands, setBrands] = useState<BrandFormData[]>([
    {
      id: '1',
      name: '',
      wholesaleCost: 0,
      yourCost: 0,
      tariffTax: 0,
      isTariffEnabled: false,
      notes: ''
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});

  const resetForm = () => {
    setCompanyName('');
    setContactInfo({
      companyEmail: '',
      companyPhone: '',
      supportEmail: '',
      supportPhone: '',
      website: '',
      repName: '',
      repEmail: '',
      repPhone: ''
    });
    setBrands([{
      id: '1',
      name: '',
      wholesaleCost: 0,
      yourCost: 0,
      tariffTax: 0,
      isTariffEnabled: false,
      notes: ''
    }]);
    setErrors({});
    setWarnings({});
  };

  const handleContactInfoChange = (field: string, value: string) => {
    setContactInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBrandChange = (brandId: string, field: keyof BrandFormData, value: string | number | boolean) => {
    setBrands(prev => prev.map(brand => 
      brand.id === brandId ? { ...brand, [field]: value } : brand
    ));
  };

  const handleTariffToggle = (brandId: string) => {
    setBrands(prev => prev.map(brand => {
      if (brand.id === brandId) {
        const newEnabled = !brand.isTariffEnabled;
        return {
          ...brand,
          isTariffEnabled: newEnabled,
          tariffTax: newEnabled ? brand.tariffTax : 0
        };
      }
      return brand;
    }));
  };

  const addBrand = () => {
    const newBrand: BrandFormData = {
      id: Date.now().toString(),
      name: '',
      wholesaleCost: 0,
      yourCost: 0,
      tariffTax: 0,
      isTariffEnabled: false,
      notes: ''
    };
    setBrands(prev => [...prev, newBrand]);
  };

  const removeBrand = (brandId: string) => {
    if (brands.length > 1) {
      setBrands(prev => prev.filter(brand => brand.id !== brandId));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    // Validate at least one brand with name
    const validBrands = brands.filter(brand => brand.name.trim());
    if (validBrands.length === 0) {
      newErrors.brands = 'At least one brand with a name is required';
    }

    // Validate each brand
    const newWarnings: Record<string, string> = {};
    brands.forEach((brand, index) => {
      if (brand.name.trim()) {
        if (!brand.wholesaleCost || brand.wholesaleCost <= 0) {
          newErrors[`brand_${brand.id}_wholesale`] = 'Wholesale cost must be greater than 0';
        }
        if (!brand.yourCost || brand.yourCost <= 0) {
          newErrors[`brand_${brand.id}_yourCost`] = 'Your cost must be greater than 0';
        }
        // Only block if your cost is GREATER than wholesale (error condition)
        // If equal, show a warning but allow save
        if (brand.yourCost && brand.wholesaleCost) {
          if (brand.yourCost > brand.wholesaleCost) {
            newErrors[`brand_${brand.id}_yourCost`] = 'Your cost cannot be greater than wholesale cost';
          } else if (brand.yourCost === brand.wholesaleCost) {
            newWarnings[`brand_${brand.id}_yourCost`] = 'Your cost equals wholesale cost (0% discount)';
          }
        }
      }
    });

    setErrors(newErrors);
    setWarnings(newWarnings);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      const validBrands: Brand[] = brands
        .filter(brand => brand.name.trim())
        .map(brand => ({
          id: `${Date.now()}_${brand.id}`,
          name: brand.name.trim(),
          wholesaleCost: brand.wholesaleCost,
          yourCost: brand.yourCost,
          tariffTax: brand.isTariffEnabled ? brand.tariffTax : 0,
          notes: brand.notes.trim()
        }));

      const newCompany: Company = {
        id: Date.now().toString(),
        name: companyName.trim(),
        brands: validBrands,
        contactInfo: {
          companyEmail: contactInfo.companyEmail.trim(),
          companyPhone: contactInfo.companyPhone.trim(),
          supportEmail: contactInfo.supportEmail.trim(),
          supportPhone: contactInfo.supportPhone.trim(),
          website: contactInfo.website.trim(),
          repName: contactInfo.repName.trim(),
          repEmail: contactInfo.repEmail.trim(),
          repPhone: contactInfo.repPhone.trim()
        }
      };

      onSave(newCompany);
      resetForm();
      onClose();
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Calculate discount percentage
  const calculateDiscountPercentage = (wholesale: number, yourCost: number): number => {
    if (wholesale <= 0 || yourCost >= wholesale) return 0;
    return Math.round(((wholesale - yourCost) / wholesale) * 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 rounded-lg p-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Add New Company</h3>
                  <p className="text-sm text-gray-500">Create a new optical company with brands and costs</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  className={`block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    errors.companyName ? 'border-red-300' : 'border-gray-300'
                  }`}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>

              {/* Company Information Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Building2 className="h-5 w-5 mr-2 text-gray-600" />
                  Company Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={contactInfo.companyEmail}
                        onChange={(e) => handleContactInfoChange('companyEmail', e.target.value)}
                        placeholder="info@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={contactInfo.companyPhone}
                        onChange={(e) => handleContactInfoChange('companyPhone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Support Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={contactInfo.supportEmail}
                        onChange={(e) => handleContactInfoChange('supportEmail', e.target.value)}
                        placeholder="support@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Support Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={contactInfo.supportPhone}
                        onChange={(e) => handleContactInfoChange('supportPhone', e.target.value)}
                        placeholder="(555) 987-6543"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="url"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={contactInfo.website}
                        onChange={(e) => handleContactInfoChange('website', e.target.value)}
                        placeholder="https://www.company.com"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rep Information Section */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-gray-600" />
                  Sales Representative
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rep Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={contactInfo.repName}
                        onChange={(e) => handleContactInfoChange('repName', e.target.value)}
                        placeholder="John Smith"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rep Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={contactInfo.repEmail}
                        onChange={(e) => handleContactInfoChange('repEmail', e.target.value)}
                        placeholder="john.smith@company.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rep Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        value={contactInfo.repPhone}
                        onChange={(e) => handleContactInfoChange('repPhone', e.target.value)}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Brands Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900 flex items-center">
                    <Building2 className="h-5 w-5 mr-2 text-gray-600" />
                    Brands & Costs *
                  </h4>
                  <button
                    type="button"
                    onClick={addBrand}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Brand
                  </button>
                </div>

                {errors.brands && (
                  <p className="mb-4 text-sm text-red-600">{errors.brands}</p>
                )}

                <div className="space-y-6">
                  {brands.map((brand, index) => {
                    const discountPercentage = calculateDiscountPercentage(brand.wholesaleCost, brand.yourCost);
                    
                    return (
                      <div key={brand.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="text-md font-medium text-gray-900">Brand #{index + 1}</h5>
                          {brands.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBrand(brand.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Brand Name
                            </label>
                            <input
                              type="text"
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              value={brand.name}
                              onChange={(e) => handleBrandChange(brand.id, 'name', e.target.value)}
                              placeholder="Enter brand name"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Wholesale Cost
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                                  errors[`brand_${brand.id}_wholesale`] ? 'border-red-300' : 'border-gray-300'
                                }`}
                                value={brand.wholesaleCost}
                                onChange={(e) => handleBrandChange(brand.id, 'wholesaleCost', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </div>
                            {errors[`brand_${brand.id}_wholesale`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`brand_${brand.id}_wholesale`]}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Your Cost
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <DollarSign className="h-4 w-4 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                                  errors[`brand_${brand.id}_yourCost`] ? 'border-red-300' : warnings[`brand_${brand.id}_yourCost`] ? 'border-yellow-300' : 'border-gray-300'
                                }`}
                                value={brand.yourCost}
                                onChange={(e) => handleBrandChange(brand.id, 'yourCost', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </div>
                            {errors[`brand_${brand.id}_yourCost`] && (
                              <p className="mt-1 text-sm text-red-600">{errors[`brand_${brand.id}_yourCost`]}</p>
                            )}
                            {!errors[`brand_${brand.id}_yourCost`] && warnings[`brand_${brand.id}_yourCost`] && (
                              <p className="mt-1 text-sm text-yellow-600">{warnings[`brand_${brand.id}_yourCost`]}</p>
                            )}
                          </div>

                          {/* Discount Percentage Display */}
                          {discountPercentage > 0 && (
                            <div className="md:col-span-2">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm font-medium text-green-800">
                                  Discount: {discountPercentage}% | Save ${(brand.wholesaleCost - brand.yourCost).toFixed(2)} per frame
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Tariff Tax Toggle */}
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-3">
                              <label className="text-sm font-medium text-gray-700">
                                Tariff Tax
                              </label>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Enable tariff tax</span>
                                <button
                                  type="button"
                                  onClick={() => handleTariffToggle(brand.id)}
                                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                                    brand.isTariffEnabled ? 'bg-blue-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                      brand.isTariffEnabled ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>

                            {brand.isTariffEnabled && (
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <DollarSign className="h-4 w-4 text-gray-400" />
                                </div>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  value={brand.tariffTax}
                                  onChange={(e) => handleBrandChange(brand.id, 'tariffTax', parseFloat(e.target.value) || 0)}
                                  placeholder="0.00"
                                />
                              </div>
                            )}
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes
                            </label>
                            <textarea
                              rows={2}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              value={brand.notes}
                              onChange={(e) => handleBrandChange(brand.id, 'notes', e.target.value)}
                              placeholder="Add notes about this brand..."
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                Create Company
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddCompanyModal;