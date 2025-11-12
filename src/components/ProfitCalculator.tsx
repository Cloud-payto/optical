import React, { useState, useEffect, useRef } from 'react';
import { ProfitData, SavedCalculation } from '../types';
import { Company, Brand, fetchCompaniesWithPricing } from '../services/api';
import { calculateProfit, calculateNonInsuranceProfit, calculateRetailPrice } from '../utils/calculations';
import ProfitDisplay from './ProfitDisplay';
import { DollarSignIcon, SaveIcon, PrinterIcon, SlidersIcon, ChevronDownIcon, PlusIcon, TagIcon, ShieldIcon, BuildingIcon } from 'lucide-react';
import { useDemo } from '../contexts/DemoContext';
import {
  validateCurrencyInput,
  validatePercentageInput,
  formatToDecimals,
  getValidationWarning,
  parseNumericInput
} from '../utils/inputValidation';

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Companies will now be loaded from Supabase instead of localStorage

// Helper function to load saved brands from localStorage or use defaults (legacy support)
const loadSavedBrands = (): string[] => {
  const savedBrands = localStorage.getItem('optiprofit_brands');
  return savedBrands ? JSON.parse(savedBrands) : [
    'Luxottica', 'Safilo', 'Marcolin', 'Essilor', 'Zeiss', 'Modo', 'Other'
  ];
};

// Common insurance providers
const INSURANCE_PROVIDERS = [
  'VSP',
  'EyeMed',
  'Davis Vision',
  'Superior Vision',
  'UnitedHealthcare Vision',
  'Humana Vision',
  'Aetna Vision',
  'Cigna Vision',
  'Spectera',
  'Other'
];

// Common insurance plans
const INSURANCE_PLANS = [
  'Basic Plan',
  'Premium Plan',
  'Plus Plan',
  'Choice Plan',
  'Advantage Plan',
  'Select Plan',
  'Elite Plan',
  'Standard Plan',
  'Enhanced Plan',
  'Other'
];

// Function to load saved calculations from localStorage
const loadSavedCalculations = (): SavedCalculation[] => {
  const savedCalcs = localStorage.getItem('optiprofit_calculations');
  return savedCalcs ? JSON.parse(savedCalcs) : [];
};

const ProfitCalculator: React.FC = () => {
  const { isDemo, demoData, notifyUserAction } = useDemo();
  const [yourCost, setYourCost] = useState<number>(47);
  const [wholesaleCost, setWholesaleCost] = useState<number>(72);
  const [tariffTax, setTariffTax] = useState<number>(0);
  const [discountPercentage, setDiscountPercentage] = useState<number>(10); // Default 10% discount
  const [isEditingDiscount, setIsEditingDiscount] = useState<boolean>(false); // Track if user is manually editing discount
  const [isEditingYourCost, setIsEditingYourCost] = useState<boolean>(false); // Track if user is manually editing your cost
  const [retailPrice, setRetailPrice] = useState<number>(180);
  const [insuranceMultiplier, setInsuranceMultiplier] = useState<number>(2.5);
  const [useManualRetailPrice, setUseManualRetailPrice] = useState<boolean>(false);
  const [insuranceCoverage, setInsuranceCoverage] = useState<number>(150);
  const [insuranceReimbursement, setInsuranceReimbursement] = useState<number>(57);
  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>(loadSavedCalculations());
  const [animateCalculation, setAnimateCalculation] = useState<boolean>(false);
  const [insuranceEnabled, setInsuranceEnabled] = useState<boolean>(true);

  // Validation warning state
  const [yourCostWarning, setYourCostWarning] = useState<string | null>(null);
  const [wholesaleCostWarning, setWholesaleCostWarning] = useState<string | null>(null);
  const [retailPriceWarning, setRetailPriceWarning] = useState<string | null>(null);

  // Company and Brand selection state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState<boolean>(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState<boolean>(false);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  
  // Legacy brand selection state (for backward compatibility)
  const [brands, setBrands] = useState<string[]>(loadSavedBrands());
  const [legacySelectedBrand, setLegacySelectedBrand] = useState<string>('');
  const [showLegacyBrandDropdown, setShowLegacyBrandDropdown] = useState<boolean>(false);
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [showAddBrand, setShowAddBrand] = useState<boolean>(false);
  
  // Insurance provider state
  const [selectedInsurance, setSelectedInsurance] = useState<string>('');
  const [showInsuranceDropdown, setShowInsuranceDropdown] = useState<boolean>(false);
  const [customInsurance, setCustomInsurance] = useState<string>('');
  const [showCustomInsurance, setShowCustomInsurance] = useState<boolean>(false);
  
  // Insurance plan state
  const [selectedInsurancePlan, setSelectedInsurancePlan] = useState<string>('');
  const [showInsurancePlanDropdown, setShowInsurancePlanDropdown] = useState<boolean>(false);
  const [customInsurancePlan, setCustomInsurancePlan] = useState<string>('');
  const [showCustomInsurancePlan, setShowCustomInsurancePlan] = useState<boolean>(false);
  
  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saveFrameName, setSaveFrameName] = useState<string>('');
  
  // Refs for handling clicks outside dropdowns
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);
  const legacyBrandDropdownRef = useRef<HTMLDivElement>(null);
  const insuranceDropdownRef = useRef<HTMLDivElement>(null);
  const insurancePlanDropdownRef = useRef<HTMLDivElement>(null);
  const saveDialogRef = useRef<HTMLDivElement>(null);

  // Load companies from Supabase or demo data
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        setCompaniesError(null);

        // If in demo mode, show ONLY demo vendors (hide real data)
        if (isDemo) {
          console.log('🎬 Demo mode: Loading ONLY demo vendors in calculator');
          setCompanies(demoData.vendors as Company[]);
        } else {
          const companiesData = await fetchCompaniesWithPricing();
          console.log('🔥 DEBUG: Calculator loaded companies:', companiesData);

          // Log brands with their pricing data
          companiesData.forEach(company => {
            console.log(`🔥 DEBUG: Company "${company.name}" has ${company.brands.length} brands:`);
            company.brands.forEach(brand => {
              console.log(`  - ${brand.name}: yourCost=${brand.yourCost}, wholesaleCost=${brand.wholesaleCost}, tariffTax=${brand.tariffTax}`);
            });
          });

          setCompanies(companiesData);
        }
      } catch (error) {
        console.error('Error loading companies:', error);
        setCompaniesError('Failed to load companies. Please try again.');
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [isDemo, demoData?.vendors]);

  // Helper function to calculate Your Cost from Wholesale Cost and Discount %
  const calculateYourCostFromDiscount = (wholesale: number, discount: number): number => {
    return wholesale * (1 - discount / 100);
  };

  // Helper function to calculate Discount % from Wholesale Cost and Your Cost
  const calculateDiscountFromYourCost = (wholesale: number, yourCost: number): number => {
    if (wholesale === 0) return 0;
    return ((wholesale - yourCost) / wholesale) * 100;
  };

  // Update Your Cost when wholesale cost or discount % changes (but not when user is manually editing Your Cost)
  useEffect(() => {
    if (!isEditingYourCost) {
      const newYourCost = calculateYourCostFromDiscount(wholesaleCost, discountPercentage);
      setYourCost(newYourCost);
    }
  }, [wholesaleCost, discountPercentage, isEditingYourCost]);

  // Calculate retail price based on multiplier when not using manual price
  useEffect(() => {
    if (!useManualRetailPrice) {
      setRetailPrice(calculateRetailPrice(wholesaleCost, tariffTax, insuranceMultiplier));
    }
  }, [wholesaleCost, tariffTax, insuranceMultiplier, useManualRetailPrice]);

  // Enable manual retail price mode during demo for better interactivity
  useEffect(() => {
    if (isDemo) {
      setUseManualRetailPrice(true);
    }
  }, [isDemo]);

  // Update multiplier when insurance toggle changes
  useEffect(() => {
    if (!insuranceEnabled && insuranceMultiplier !== 2.0) {
      setInsuranceMultiplier(2.0); // Default to 2x for non-insurance
    } else if (insuranceEnabled && insuranceMultiplier === 2.0) {
      setInsuranceMultiplier(2.5); // Default back to 2.5x for insurance
    }
  }, [insuranceEnabled, insuranceMultiplier]);

  const profitData: ProfitData = insuranceEnabled 
    ? calculateProfit(
        yourCost,
        wholesaleCost,
        tariffTax,
        retailPrice,
        insuranceCoverage,
        insuranceReimbursement
      )
    : calculateNonInsuranceProfit(
        yourCost,
        wholesaleCost,
        tariffTax,
        retailPrice
      );

  useEffect(() => {
    setAnimateCalculation(true);
    const timer = setTimeout(() => setAnimateCalculation(false), 300);
    return () => clearTimeout(timer);
  }, [profitData.profit]);
  
  // Save brands to localStorage when updated
  useEffect(() => {
    localStorage.setItem('optiprofit_brands', JSON.stringify(brands));
  }, [brands]);
  
  // Save calculations to localStorage when updated
  useEffect(() => {
    localStorage.setItem('optiprofit_calculations', JSON.stringify(savedCalculations));
  }, [savedCalculations]);
  
  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setShowCompanyDropdown(false);
      }
      if (brandDropdownRef.current && !brandDropdownRef.current.contains(event.target as Node)) {
        setShowBrandDropdown(false);
      }
      if (legacyBrandDropdownRef.current && !legacyBrandDropdownRef.current.contains(event.target as Node)) {
        setShowLegacyBrandDropdown(false);
        setShowAddBrand(false);
      }
      if (insuranceDropdownRef.current && !insuranceDropdownRef.current.contains(event.target as Node)) {
        setShowInsuranceDropdown(false);
        setShowCustomInsurance(false);
      }
      if (insurancePlanDropdownRef.current && !insurancePlanDropdownRef.current.contains(event.target as Node)) {
        setShowInsurancePlanDropdown(false);
        setShowCustomInsurancePlan(false);
      }
      if (saveDialogRef.current && !saveDialogRef.current.contains(event.target as Node)) {
        setShowSaveDialog(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle company selection
  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company);
    setSelectedBrand(null); // Reset brand selection when company changes
    setShowCompanyDropdown(false);

    // Notify demo system that user selected a company
    if (isDemo) {
      console.log('🎬 Demo: User selected company:', company.name);
      notifyUserAction('select', { companyId: company.id, companyName: company.name });
    }
  };

  // Handle brand selection and auto-populate fields
  const handleBrandSelect = (brand: Brand) => {
    console.log('🔥 DEBUG: Brand selected in calculator:', brand);
    setSelectedBrand(brand);
    setShowBrandDropdown(false);

    // Notify demo system that user selected a brand
    if (isDemo) {
      console.log('🎬 Demo: User selected brand:', brand.name);
      notifyUserAction('select', { brandId: brand.id, brandName: brand.name });
    }

    // Auto-populate wholesale cost and tariff tax
    if (brand.wholesaleCost !== undefined && brand.wholesaleCost !== null) {
      console.log('🔥 DEBUG: Setting wholesaleCost from brand:', brand.wholesaleCost);
      setWholesaleCost(brand.wholesaleCost);
    }
    if (brand.tariffTax !== undefined && brand.tariffTax !== null) {
      console.log('🔥 DEBUG: Setting tariffTax from brand:', brand.tariffTax);
      setTariffTax(brand.tariffTax);
    }

    // Calculate discount % from brand's yourCost if available
    if (brand.yourCost !== undefined && brand.yourCost !== null && brand.wholesaleCost) {
      const calculatedDiscount = calculateDiscountFromYourCost(brand.wholesaleCost, brand.yourCost);
      console.log('🔥 DEBUG: Calculated discount from brand yourCost:', calculatedDiscount);
      setDiscountPercentage(calculatedDiscount);
      // Your Cost will auto-update via useEffect
    }

    // Set retail price from brand MSRP if available
    if (brand.retailPrice !== undefined && brand.retailPrice !== null && brand.retailPrice > 0) {
      console.log('🔥 DEBUG: Setting retailPrice from brand MSRP:', brand.retailPrice);
      setRetailPrice(brand.retailPrice);
      setUseManualRetailPrice(true); // Switch to manual mode since we're using saved MSRP
    } else {
      // Calculate retail price based on wholesale cost and multiplier if no MSRP
      if (brand.wholesaleCost !== undefined && brand.wholesaleCost !== null && !useManualRetailPrice) {
        const calculatedRetail = calculateRetailPrice(brand.wholesaleCost, brand.tariffTax || 0, insuranceMultiplier);
        console.log('🔥 DEBUG: No MSRP found, calculated retail price:', calculatedRetail);
        setRetailPrice(calculatedRetail);
      }
    }
  };

  const handleSaveCalculation = () => {
    // Show save dialog instead of immediately saving
    setSaveFrameName(`Frame ${savedCalculations.length + 1}`);
    setShowSaveDialog(true);
  };
  
  const handleConfirmSave = () => {
    // Determine brand name from either new brand system or legacy system
    const brandName = selectedBrand ? 
      `${selectedCompany?.name} - ${selectedBrand.name}` : 
      legacySelectedBrand;
      
    const newCalculation: SavedCalculation = {
      id: Date.now(),
      name: saveFrameName.trim() || `Frame ${savedCalculations.length + 1}`,
      brand: brandName,
      insurance: selectedInsurance,
      insurancePlan: selectedInsurancePlan,
      insuranceEnabled,
      yourCost,
      wholesaleCost,
      tariffTax,
      retailPrice,
      insuranceCoverage,
      insuranceReimbursement,
      profit: profitData.profit,
      margin: profitData.profitMargin,
      date: new Date().toLocaleDateString()
    };
    
    setSavedCalculations([...savedCalculations, newCalculation]);
    setShowSaveDialog(false);
    setSaveFrameName('');
  };
  
  const handleAddBrand = () => {
    if (newBrandName.trim() && !brands.includes(newBrandName.trim())) {
      const updatedBrands = [...brands, newBrandName.trim()];
      setBrands(updatedBrands);
      setSelectedBrand(newBrandName.trim());
      setNewBrandName('');
      setShowAddBrand(false);
    }
  };

  const handleInsuranceSelect = (provider: string) => {
    if (provider === 'Other') {
      setShowCustomInsurance(true);
      setSelectedInsurance('');
    } else {
      setSelectedInsurance(provider);
      setShowCustomInsurance(false);
      setShowInsuranceDropdown(false);
    }
  };

  const handleCustomInsuranceSave = () => {
    if (customInsurance.trim()) {
      setSelectedInsurance(customInsurance.trim());
      setShowCustomInsurance(false);
      setShowInsuranceDropdown(false);
    }
  };

  const handleInsurancePlanSelect = (plan: string) => {
    if (plan === 'Other') {
      setShowCustomInsurancePlan(true);
      setSelectedInsurancePlan('');
    } else {
      setSelectedInsurancePlan(plan);
      setShowCustomInsurancePlan(false);
      setShowInsurancePlanDropdown(false);
    }
  };

  const handleCustomInsurancePlanSave = () => {
    if (customInsurancePlan.trim()) {
      setSelectedInsurancePlan(customInsurancePlan.trim());
      setShowCustomInsurancePlan(false);
      setShowInsurancePlanDropdown(false);
    }
  };
  
  const handleLoadSavedCalculation = (calculation: SavedCalculation) => {
    setYourCost(calculation.yourCost);
    setWholesaleCost(calculation.wholesaleCost);
    setTariffTax(calculation.tariffTax || 0); // Handle older saved calculations that might not have tariffTax
    setRetailPrice(calculation.retailPrice);
    setInsuranceCoverage(calculation.insuranceCoverage);
    setInsuranceReimbursement(calculation.insuranceReimbursement);
    
    // Restore insurance toggle state, default to true for backward compatibility
    setInsuranceEnabled(calculation.insuranceEnabled !== undefined ? calculation.insuranceEnabled : true);
    
    // Handle brand loading - check if it's new format (Company - Brand) or legacy
    if (calculation.brand && calculation.brand.includes(' - ')) {
      const [companyName, brandName] = calculation.brand.split(' - ');
      const company = companies.find(c => c.name === companyName);
      if (company) {
        const brand = company.brands.find(b => b.name === brandName);
        if (brand) {
          setSelectedCompany(company);
          setSelectedBrand(brand);
          setLegacySelectedBrand('');
        } else {
          // Fallback to legacy if brand not found
          setLegacySelectedBrand(calculation.brand || '');
          setSelectedCompany(null);
          setSelectedBrand(null);
        }
      } else {
        // Fallback to legacy if company not found
        setLegacySelectedBrand(calculation.brand || '');
        setSelectedCompany(null);
        setSelectedBrand(null);
      }
    } else {
      // Legacy brand format
      setLegacySelectedBrand(calculation.brand || '');
      setSelectedCompany(null);
      setSelectedBrand(null);
    }
    
    setSelectedInsurance(calculation.insurance || '');
    setSelectedInsurancePlan(calculation.insurancePlan || '');
    
    // Calculate and set the insurance multiplier
    if (calculation.wholesaleCost > 0) {
      const multiplier = calculation.retailPrice / calculation.wholesaleCost;
      setInsuranceMultiplier(parseFloat(multiplier.toFixed(1)));
    }
    
    // Enable manual retail price since we're setting it directly
    setUseManualRetailPrice(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white dark:bg-[#1F2623] rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="md:flex">
        <div className="p-6 md:w-1/2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Frame Profitability Calculator</h2>
          
          {/* Insurance Toggle */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-[#181F1C]/50 rounded-lg border border-gray-300 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Insurance Billing</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {insuranceEnabled 
                    ? "Calculate profit with insurance provider billing" 
                    : "Calculate profit for cash-pay customers (2x wholesale pricing)"
                  }
                </p>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="insuranceToggle"
                  className="sr-only"
                  checked={insuranceEnabled}
                  onChange={(e) => setInsuranceEnabled(e.target.checked)}
                />
                <label
                  htmlFor="insuranceToggle"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    insuranceEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      insuranceEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </label>
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                  {insuranceEnabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* 2x2 Grid for Company/Insurance and Brand/Insurance Plan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-4">
                {/* Company Dropdown */}
                <div className="space-y-2">
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Company
                  </label>
                  <div className="relative" ref={companyDropdownRef}>
                    <button
                      type="button"
                      data-demo="company-dropdown"
                      data-tour="company-dropdown"
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                    >
                      <div className="flex items-center">
                        <BuildingIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="truncate text-gray-800 dark:text-white">{selectedCompany?.name || 'Select a company'}</span>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    </button>

                    {showCompanyDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1F2623] shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                        <ul className="py-1">
                          {loadingCompanies ? (
                            <li className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                              Loading companies...
                            </li>
                          ) : companiesError ? (
                            <li className="px-4 py-2 text-red-500 text-sm">
                              {companiesError}
                            </li>
                          ) : companies.length === 0 ? (
                            <li className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                              No companies available. Add companies in Brands & Costs.
                            </li>
                          ) : (
                            companies.map((company) => (
                              <li key={company.id}>
                                <button
                                  type="button"
                                  className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedCompany?.id === company.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-white'}`}
                                  onClick={() => handleCompanySelect(company)}
                                >
                                  {company.name}
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Insurance Provider Dropdown */}
                {insuranceEnabled && (
                  <div className="space-y-2">
                    <label htmlFor="insurance" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Insurance Provider
                    </label>
                  <div className="relative" ref={insuranceDropdownRef}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      onClick={() => setShowInsuranceDropdown(!showInsuranceDropdown)}
                    >
                      <div className="flex items-center">
                        <ShieldIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="truncate text-gray-800 dark:text-white">{selectedInsurance || 'Select insurance provider'}</span>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    </button>

                    {showInsuranceDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1F2623] shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                        <ul className="py-1">
                          {INSURANCE_PROVIDERS.map((provider) => (
                            <li key={provider}>
                              <button
                                type="button"
                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedInsurance === provider ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-white'}`}
                                onClick={() => handleInsuranceSelect(provider)}
                              >
                                {provider}
                              </button>
                            </li>
                          ))}
                        </ul>
                        
                        {showCustomInsurance && (
                          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                className="flex-grow px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Custom insurance provider"
                                value={customInsurance}
                                onChange={(e) => setCustomInsurance(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCustomInsuranceSave();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={handleCustomInsuranceSave}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
              
              {/* RIGHT COLUMN */}
              <div className="space-y-4">
                {/* Brand Dropdown */}
                <div className="space-y-2">
                  <label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Brand
                  </label>
                  <div className="relative" ref={brandDropdownRef}>
                    <button
                      type="button"
                      data-demo="brand-dropdown"
                      data-tour="brand-dropdown"
                      className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        !selectedCompany ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => selectedCompany && setShowBrandDropdown(!showBrandDropdown)}
                      disabled={!selectedCompany}
                    >
                      <div className="flex items-center">
                        <TagIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="truncate text-gray-800 dark:text-white">
                          {selectedBrand?.name || (selectedCompany ? 'Select a brand' : 'Select company first')}
                        </span>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    </button>

                    {showBrandDropdown && selectedCompany && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1F2623] shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                        <ul className="py-1">
                          {selectedCompany.brands.map((brand) => (
                            <li key={brand.id}>
                              <button
                                type="button"
                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedBrand?.id === brand.id ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-white'}`}
                                onClick={() => handleBrandSelect(brand)}
                              >
                                <div>
                                  <div className="font-medium">{brand.name}</div>
                                  {(brand.wholesale_cost || brand.your_cost) && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {brand.your_cost !== null && brand.your_cost !== undefined && `Your Cost: $${brand.your_cost}`}
                                      {brand.wholesale_cost !== null && brand.wholesale_cost !== undefined && ` • Wholesale: $${brand.wholesale_cost}`}
                                      {brand.tariff_tax !== null && brand.tariff_tax !== undefined && ` • Tariff: $${brand.tariff_tax}`}
                                    </div>
                                  )}
                                </div>
                              </button>
                            </li>
                          ))}
                          {selectedCompany.brands.length === 0 && (
                            <li className="px-4 py-2 text-gray-500 dark:text-gray-400 text-sm">
                              No brands available for this company.
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Insurance Plan Dropdown */}
                {insuranceEnabled && (
                  <div className="space-y-2">
                    <label htmlFor="insurancePlan" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Insurance Plan
                    </label>
                  <div className="relative" ref={insurancePlanDropdownRef}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      onClick={() => setShowInsurancePlanDropdown(!showInsurancePlanDropdown)}
                    >
                      <div className="flex items-center">
                        <ShieldIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="truncate text-gray-800 dark:text-white">{selectedInsurancePlan || 'Select insurance plan'}</span>
                      </div>
                      <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    </button>

                    {showInsurancePlanDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1F2623] shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                        <ul className="py-1">
                          {INSURANCE_PLANS.map((plan) => (
                            <li key={plan}>
                              <button
                                type="button"
                                className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedInsurancePlan === plan ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-white'}`}
                                onClick={() => handleInsurancePlanSelect(plan)}
                              >
                                {plan}
                              </button>
                            </li>
                          ))}
                        </ul>

                        {showCustomInsurancePlan && (
                          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex space-x-2">
                              <input
                                type="text"
                                className="flex-grow px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Custom insurance plan"
                                value={customInsurancePlan}
                                onChange={(e) => setCustomInsurancePlan(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCustomInsurancePlanSave();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={handleCustomInsurancePlanSave}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}
              </div>
            </div>
            {/* End of 2x2 grid */}
            
            {/* Legacy Brand Dropdown - shown when no companies are available or still loading */}
            {(companies.length === 0 && !loadingCompanies) && (
              <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <label htmlFor="legacyBrand" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Brand (Legacy)
                </label>
                <div className="relative" ref={legacyBrandDropdownRef}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    onClick={() => setShowLegacyBrandDropdown(!showLegacyBrandDropdown)}
                  >
                    <div className="flex items-center">
                      <TagIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                      <span className="truncate text-gray-800 dark:text-white">{legacySelectedBrand || 'Select a brand'}</span>
                    </div>
                    <ChevronDownIcon className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  </button>

                  {showLegacyBrandDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white dark:bg-[#1F2623] shadow-lg rounded-md border border-gray-200 dark:border-gray-700 max-h-60 overflow-auto">
                      <ul className="py-1">
                        {brands.map((brand) => (
                          <li key={brand}>
                            <button
                              type="button"
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${legacySelectedBrand === brand ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'text-gray-800 dark:text-white'}`}
                              onClick={() => {
                                setLegacySelectedBrand(brand);
                                setShowLegacyBrandDropdown(false);
                              }}
                            >
                              {brand}
                            </button>
                          </li>
                        ))}
                        <li className="border-t border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center"
                            onClick={() => {
                              setShowAddBrand(true);
                            }}
                          >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Add New Brand
                          </button>
                        </li>
                      </ul>

                      {showAddBrand && (
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              className="flex-grow px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                              placeholder="New brand name"
                              value={newBrandName}
                              onChange={(e) => setNewBrandName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddBrand();
                                }
                              }}
                            />
                            <button
                              type="button"
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              onClick={handleAddBrand}
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Add companies in the Brands & Costs section to use the enhanced company/brand system.
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-demo="cost-fields" data-tour="cost-fields">
              {/* Your Actual Cost */}
              <div className="space-y-2">
                <label htmlFor="yourCost" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Your Actual Cost
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10000"
                    inputMode="decimal"
                    id="yourCost"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      yourCostWarning
                        ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500'
                        : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                    } rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white`}
                    value={yourCost}
                    onFocus={() => setIsEditingYourCost(true)}
                    onChange={(e) => {
                      const validated = validateCurrencyInput(e.target.value, 0, 10000);
                      if (validated !== null) {
                        setYourCost(validated);
                        setIsEditingDiscount(false);
                        // Update discount % based on new Your Cost
                        const newDiscount = calculateDiscountFromYourCost(wholesaleCost, validated);
                        // Format discount to avoid floating-point precision issues
                        setDiscountPercentage(formatToDecimals(newDiscount, 1));
                        // Check for warnings
                        const warning = getValidationWarning('Your Actual Cost', validated, 0.01, 10000);
                        setYourCostWarning(warning);
                      }
                    }}
                    onBlur={() => {
                      const formatted = formatToDecimals(yourCost, 2);
                      setYourCost(formatted);
                      setIsEditingYourCost(false);
                    }}
                  />
                </div>

                {yourCostWarning && (
                  <div className="flex items-start space-x-2 mt-1">
                    <svg className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">{yourCostWarning}</p>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Calculated from wholesale cost - {discountPercentage.toFixed(1)}% discount
                </p>
              </div>

              {/* Discount Percentage */}
              <div className="space-y-2">
                <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                  Discount %
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 dark:text-gray-500 text-sm">%</span>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    inputMode="decimal"
                    id="discountPercentage"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                    value={discountPercentage}
                    onFocus={() => setIsEditingDiscount(true)}
                    onChange={(e) => {
                      const validated = validatePercentageInput(e.target.value);
                      if (validated !== null) {
                        setDiscountPercentage(validated);
                        setIsEditingYourCost(false);
                        // Your Cost will auto-update via useEffect
                      }
                    }}
                    onBlur={() => {
                      const formatted = formatToDecimals(discountPercentage, 1);
                      setDiscountPercentage(formatted);
                      setIsEditingDiscount(false);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Your cost = ${calculateYourCostFromDiscount(wholesaleCost, discountPercentage).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="wholesaleCost" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Wholesale Cost (Frame Book Price)
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSignIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10000"
                  inputMode="decimal"
                  id="wholesaleCost"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    wholesaleCostWarning
                      ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white`}
                  value={wholesaleCost}
                  onChange={(e) => {
                    const validated = validateCurrencyInput(e.target.value, 0, 10000);
                    if (validated !== null) {
                      setWholesaleCost(validated);
                      const warning = getValidationWarning('Wholesale Cost', validated, 0.01, 10000);
                      setWholesaleCostWarning(warning);
                    }
                  }}
                  onBlur={() => {
                    const formatted = formatToDecimals(wholesaleCost, 2);
                    setWholesaleCost(formatted);
                  }}
                />
              </div>
              {wholesaleCostWarning && (
                <div className="flex items-start space-x-2 mt-1">
                  <svg className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">{wholesaleCostWarning}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="tariffTax" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Tariff Tax
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSignIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000"
                  inputMode="decimal"
                  id="tariffTax"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  value={tariffTax}
                  onChange={(e) => {
                    const validated = validateCurrencyInput(e.target.value, 0, 1000);
                    if (validated !== null) {
                      setTariffTax(validated);
                    } else if (e.target.value === '') {
                      setTariffTax(0);
                    }
                  }}
                  onBlur={() => {
                    const formatted = formatToDecimals(tariffTax, 2);
                    setTariffTax(formatted);
                  }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="insuranceMultiplier" className="block text-sm font-medium text-gray-700 dark:text-gray-200 flex justify-between">
                <span>{insuranceEnabled ? 'Insurance ' : ''}Multiplier: {insuranceMultiplier.toFixed(1)}x</span>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="useManualPrice"
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                    checked={useManualRetailPrice}
                    onChange={(e) => setUseManualRetailPrice(e.target.checked)}
                  />
                  <label htmlFor="useManualPrice" className="text-xs text-gray-500 dark:text-gray-400">
                    Manual Price
                  </label>
                </div>
              </label>
              {!useManualRetailPrice && (
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SlidersIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="range"
                    id="insuranceMultiplier"
                    min="1"
                    max="4"
                    step="0.1"
                    className="block w-full pl-10 py-2"
                    value={insuranceMultiplier}
                    onChange={(e) => setInsuranceMultiplier(parseFloat(e.target.value))}
                  />
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 px-3">
                    <span>1x</span>
                    <span>2x</span>
                    <span>3x</span>
                    <span>4x</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2" data-demo="retail-price" data-tour="retail-price">
              <label htmlFor="retailPrice" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Retail Price
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSignIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50000"
                  inputMode="decimal"
                  id="retailPrice"
                  className={`block w-full pl-10 pr-3 py-2 border ${
                    retailPriceWarning
                      ? 'border-yellow-500 focus:ring-yellow-500 focus:border-yellow-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                  } rounded-md ${
                    !useManualRetailPrice
                      ? 'bg-gray-100 dark:bg-[#181F1C]/50 cursor-not-allowed'
                      : 'bg-white dark:bg-[#1F2623]'
                  } text-gray-800 dark:text-white`}
                  value={retailPrice}
                  onChange={(e) => {
                    const validated = validateCurrencyInput(e.target.value, 0, 50000);
                    if (validated !== null) {
                      setRetailPrice(validated);
                      if (!useManualRetailPrice) {
                        setUseManualRetailPrice(true);
                      }
                      const warning = getValidationWarning('Retail Price', validated, 0.01, 50000);
                      setRetailPriceWarning(warning);

                      // Notify demo system
                      if (isDemo) {
                        notifyUserAction('input', { retailPrice: validated });
                      }
                    }
                  }}
                  onBlur={() => {
                    const formatted = formatToDecimals(retailPrice, 2);
                    setRetailPrice(formatted);
                  }}
                  readOnly={!useManualRetailPrice}
                />
              </div>
              {retailPriceWarning && (
                <div className="flex items-start space-x-2 mt-1">
                  <svg className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">{retailPriceWarning}</p>
                </div>
              )}
              {!useManualRetailPrice && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Auto-calculated based on wholesale cost and multiplier
                </p>
              )}
            </div>

            {insuranceEnabled && (
              <>
                <div className="space-y-2">
                  <label htmlFor="insuranceCoverage" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                    Insurance Coverage Amount
                  </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSignIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50000"
                  inputMode="decimal"
                  id="insuranceCoverage"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  value={insuranceCoverage}
                  onChange={(e) => {
                    const validated = validateCurrencyInput(e.target.value, 0, 50000);
                    if (validated !== null) {
                      setInsuranceCoverage(validated);
                    }
                  }}
                  onBlur={() => {
                    const formatted = formatToDecimals(insuranceCoverage, 2);
                    setInsuranceCoverage(formatted);
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {retailPrice > insuranceCoverage ? (
                  <>Patient will pay ${profitData.patientPayment.toFixed(2)} after 20% discount</>
                ) : (
                  <>Insurance fully covers this frame</>
                )}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="insuranceReimbursement" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Insurance Reimbursement
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSignIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1000"
                  inputMode="decimal"
                  id="insuranceReimbursement"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                  value={insuranceReimbursement}
                  onChange={(e) => {
                    const validated = validateCurrencyInput(e.target.value, 0, 1000);
                    if (validated !== null) {
                      setInsuranceReimbursement(validated);
                    }
                  }}
                  onBlur={() => {
                    const formatted = formatToDecimals(insuranceReimbursement, 2);
                    setInsuranceReimbursement(formatted);
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 italic">
                Typically $57 for most insurance providers
              </p>
            </div>
            </>
            )}
          </div>
          
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleSaveCalculation}
              data-demo="save-btn"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              Save
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1F2623] hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PrinterIcon className="h-4 w-4 mr-2" />
              Print
            </button>
          </div>
          
          {/* Save Dialog */}
          {showSaveDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div ref={saveDialogRef} className="bg-white dark:bg-[#1F2623] rounded-lg p-6 max-w-md w-full">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Save Frame Calculation</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="frameName" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Frame or Patient Name
                    </label>
                    <input
                      type="text"
                      id="frameName"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-[#1F2623] text-gray-800 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter a name"
                      value={saveFrameName}
                      onChange={(e) => setSaveFrameName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Selected Brand
                    </label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#181F1C]/50 text-gray-800 dark:text-white">
                      {selectedBrand ?
                        `${selectedCompany?.name} - ${selectedBrand.name}` :
                        legacySelectedBrand || 'No brand selected'
                      }
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                      Insurance Details
                    </label>
                    <div className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-[#181F1C]/50">
                      <div className="text-gray-800 dark:text-white">{selectedInsurance || 'No insurance provider selected'}</div>
                      {selectedInsurancePlan && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">Plan: {selectedInsurancePlan}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1F2623] hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={() => setShowSaveDialog(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      onClick={handleConfirmSave}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Saved Calculations */}
          {savedCalculations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Saved Calculations</h3>
              <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {savedCalculations.map((calc) => (
                    <li
                      key={calc.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => handleLoadSavedCalculation(calc)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">{calc.name}</h4>
                          <div className="mt-1 flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-2">
                            {calc.brand && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                {calc.brand}
                              </span>
                            )}
                            {calc.insurance && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                {calc.insurance}
                                {calc.insurancePlan && ` - ${calc.insurancePlan}`}
                              </span>
                            )}
                            <span>{calc.date}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(calc.profit)}</span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{calc.margin}% margin</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 md:w-1/2 bg-gradient-to-br from-blue-50 to-gray-50 dark:from-[#181F1C] dark:to-gray-800 border-t md:border-t-0 md:border-l border-gray-200 dark:border-gray-700" data-demo="profit-display" data-tour="profit-display">
          <ProfitDisplay 
            profitData={profitData} 
            animate={animateCalculation}
            savedCalculations={savedCalculations}
            insuranceEnabled={insuranceEnabled}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfitCalculator;