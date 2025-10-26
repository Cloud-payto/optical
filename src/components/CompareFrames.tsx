import React, { useState, useEffect, useRef } from 'react';
import { DollarSignIcon, SlidersIcon, TrendingUpIcon, Check, ChevronDownIcon, PlusIcon, TagIcon, SaveIcon, BuildingIcon } from 'lucide-react';
import { calculateProfit, calculateRetailPrice, calculateDiscountPercentage } from '../utils/calculations';
import { FrameData, SavedComparison } from '../types';
import { Company, Brand, fetchCompaniesWithPricing } from '../services/api';
import { useDemo } from '../contexts/DemoContext';

// Helper function to format currency values
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

// Function to load saved comparisons from localStorage
const loadSavedComparisons = (): SavedComparison[] => {
  const savedComps = localStorage.getItem('optiprofit_comparisons');
  return savedComps ? JSON.parse(savedComps) : [];
};

interface FrameComparisonDisplayProps {
  frame1: FrameData;
  frame2: FrameData;
}

const FrameComparisonDisplay: React.FC<FrameComparisonDisplayProps> = ({ frame1, frame2 }) => {
  // Ensure we have profit data
  if (!frame1.profitData || !frame2.profitData) {
    return <div>Loading comparison data...</div>;
  }

  // Determine which frame is more profitable
  const frame1Profit = frame1.profitData.profit;
  const frame2Profit = frame2.profitData.profit;
  const isFrame1MoreProfitable = frame1Profit > frame2Profit;
  const isFrame2MoreProfitable = frame2Profit > frame1Profit;
  const profitDifference = Math.abs(frame1Profit - frame2Profit);
  
  // Determine profit margin difference
  const frame1Margin = frame1.profitData.profitMargin;
  const frame2Margin = frame2.profitData.profitMargin;
  const marginDifference = Math.abs(frame1Margin - frame2Margin);
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-center mb-6">Profit Comparison</h3>
      
      {/* Header with winner indicator */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        {isFrame1MoreProfitable && (
          <div className="flex items-center justify-center text-green-600">
            <Check className="h-5 w-5 mr-2" />
            <span className="font-bold">{frame1.frameName} is more profitable by {formatCurrency(profitDifference)}</span>
          </div>
        )}
        
        {isFrame2MoreProfitable && (
          <div className="flex items-center justify-center text-green-600">
            <Check className="h-5 w-5 mr-2" />
            <span className="font-bold">{frame2.frameName} is more profitable by {formatCurrency(profitDifference)}</span>
          </div>
        )}
        
        {!isFrame1MoreProfitable && !isFrame2MoreProfitable && (
          <div className="text-center text-gray-600 font-medium">
            Both frames have equal profitability
          </div>
        )}
      </div>
      
      {/* Side by side comparison */}
      <div className="grid grid-cols-3 gap-4">
        {/* Headers */}
        <div className="col-span-1"></div>
        <div className="col-span-1 text-center font-semibold text-blue-700 bg-blue-50 p-2 rounded-t-lg">
          {frame1.frameName}
        </div>
        <div className="col-span-1 text-center font-semibold text-green-700 bg-green-50 p-2 rounded-t-lg">
          {frame2.frameName}
        </div>
        
        {/* Your Actual Cost */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Your Actual Cost
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50">
          {formatCurrency(frame1.yourCost)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50">
          {formatCurrency(frame2.yourCost)}
        </div>
        
        {/* Wholesale Price */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Wholesale Price
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50">
          {formatCurrency(frame1.wholesaleCost)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50">
          {formatCurrency(frame2.wholesaleCost)}
        </div>
        
        {/* Discount Percentage */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Discount from Wholesale
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 font-medium">
          {calculateDiscountPercentage(frame1.yourCost, frame1.wholesaleCost)}%
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 font-medium">
          {calculateDiscountPercentage(frame2.yourCost, frame2.wholesaleCost)}%
        </div>
        
        {/* Retail Price */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Retail Price
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50">
          {formatCurrency(frame1.retailPrice)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50">
          {formatCurrency(frame2.retailPrice)}
        </div>
        
        {/* Patient Payment */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Patient Payment
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50">
          {formatCurrency(frame1.profitData.patientPayment)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50">
          {formatCurrency(frame2.profitData.patientPayment)}
        </div>
        
        {/* Insurance Reimbursement */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Insurance Reimbursement
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50">
          {formatCurrency(frame1.profitData.reimbursement)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50">
          {formatCurrency(frame2.profitData.reimbursement)}
        </div>
        
        {/* Total Revenue */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Total Revenue
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 font-medium">
          {formatCurrency(frame1.profitData.total)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 font-medium">
          {formatCurrency(frame2.profitData.total)}
        </div>
        
        {/* Profit */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Net Profit
        </div>
        <div className={`col-span-1 text-center p-2 ${isFrame1MoreProfitable ? 'bg-blue-200 font-bold' : 'bg-blue-50'}`}>
          {formatCurrency(frame1.profitData.profit)}
        </div>
        <div className={`col-span-1 text-center p-2 ${isFrame2MoreProfitable ? 'bg-green-200 font-bold' : 'bg-green-50'}`}>
          {formatCurrency(frame2.profitData.profit)}
        </div>
        
        {/* Profit Margin */}
        <div className="col-span-1 bg-gray-50 p-2 font-medium flex items-center">
          Profit Margin
        </div>
        <div className={`col-span-1 text-center p-2 ${frame1Margin > frame2Margin ? 'bg-blue-200 font-bold' : 'bg-blue-50'}`}>
          {frame1.profitData.profitMargin}%
        </div>
        <div className={`col-span-1 text-center p-2 ${frame2Margin > frame1Margin ? 'bg-green-200 font-bold' : 'bg-green-50'}`}>
          {frame2.profitData.profitMargin}%
        </div>
      </div>
      
      {/* Recommendation */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center">
          <TrendingUpIcon className="h-5 w-5 mr-2 text-blue-600" />
          Recommendation
        </h4>
        <p className="text-gray-700">
          {isFrame1MoreProfitable ? (
            <>
              <span className="font-medium">{frame1.frameName}</span> provides {formatCurrency(profitDifference)} more profit 
              ({marginDifference}% higher margin) than <span className="font-medium">{frame2.frameName}</span>.
            </>
          ) : isFrame2MoreProfitable ? (
            <>
              <span className="font-medium">{frame2.frameName}</span> provides {formatCurrency(profitDifference)} more profit 
              ({marginDifference}% higher margin) than <span className="font-medium">{frame1.frameName}</span>.
            </>
          ) : (
            <>
              Both frames offer identical profitability. Consider other factors like availability, 
              customer preference, or inventory management.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

const initialFrameData: FrameData = {
  frameName: '',
  brand: '',
  companyId: '',
  companyName: '',
  yourCost: 5,
  wholesaleCost: 50,
  tariffTax: 0,
  retailPrice: 125,
  insuranceMultiplier: 2.5,
  useManualRetailPrice: false,
  insuranceCoverage: 150,
  insuranceReimbursement: 57,
  profitData: null
};

const CompareFrames: React.FC = () => {
  const { isDemo, currentStepData } = useDemo();

  // State for companies and brands
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState<boolean>(true);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparison[]>(loadSavedComparisons());

  // Company and Brand dropdown states
  const [selectedCompany1, setSelectedCompany1] = useState<Company | null>(null);
  const [selectedCompany2, setSelectedCompany2] = useState<Company | null>(null);
  const [selectedBrand1, setSelectedBrand1] = useState<Brand | null>(null);
  const [selectedBrand2, setSelectedBrand2] = useState<Brand | null>(null);
  const [showCompanyDropdown1, setShowCompanyDropdown1] = useState<boolean>(false);
  const [showCompanyDropdown2, setShowCompanyDropdown2] = useState<boolean>(false);
  const [showBrandDropdown1, setShowBrandDropdown1] = useState<boolean>(false);
  const [showBrandDropdown2, setShowBrandDropdown2] = useState<boolean>(false);

  // Save dialog state
  const [showSaveDialog, setShowSaveDialog] = useState<boolean>(false);
  const [saveComparisonName, setSaveComparisonName] = useState<string>('');
  
  // Refs for handling clicks outside dropdowns
  const companyDropdownRef1 = useRef<HTMLDivElement>(null);
  const companyDropdownRef2 = useRef<HTMLDivElement>(null);
  const brandDropdownRef1 = useRef<HTMLDivElement>(null);
  const brandDropdownRef2 = useRef<HTMLDivElement>(null);
  const saveDialogRef = useRef<HTMLDivElement>(null);
  
  // Initialize with demo data if in demo mode
  const getDemoFrame1 = (): FrameData => ({
    frameName: 'Ray-Ban',
    brand: 'Ray-Ban',
    companyName: 'Luxottica',
    yourCost: 15,
    wholesaleCost: 150,
    tariffTax: 6,
    retailPrice: 375,
    insuranceMultiplier: 2.5,
    useManualRetailPrice: false,
    insuranceCoverage: 150,
    insuranceReimbursement: 57,
    profitData: null
  });

  const getDemoFrame2 = (): FrameData => ({
    frameName: 'Safilo Collection',
    brand: 'Safilo Collection',
    companyName: 'Safilo',
    yourCost: 16,
    wholesaleCost: 160,
    tariffTax: 6.40,
    retailPrice: 400,
    insuranceMultiplier: 2.5,
    useManualRetailPrice: false,
    insuranceCoverage: 150,
    insuranceReimbursement: 57,
    profitData: null
  });
  
  const [frame1, setFrame1] = useState<FrameData>(
    isDemo && currentStepData?.id === 'comparison-overview' 
      ? getDemoFrame1() 
      : { ...initialFrameData, frameName: '' }
  );
  
  const [frame2, setFrame2] = useState<FrameData>(
    isDemo && currentStepData?.id === 'comparison-overview'
      ? getDemoFrame2()
      : { ...initialFrameData, frameName: '' }
  );

  // Pre-fill demo data when demo reaches comparison overview
  useEffect(() => {
    if (isDemo && currentStepData?.id === 'comparison-overview') {
      setFrame1(getDemoFrame1());
      setFrame2(getDemoFrame2());
    }
  }, [isDemo, currentStepData]);

  // Calculate retail price based on multiplier when not using manual price for Frame 1
  useEffect(() => {
    if (!frame1.useManualRetailPrice) {
      setFrame1({
        ...frame1,
        retailPrice: calculateRetailPrice(frame1.wholesaleCost, frame1.tariffTax, frame1.insuranceMultiplier)
      });
    }
  }, [frame1.wholesaleCost, frame1.tariffTax, frame1.insuranceMultiplier, frame1.useManualRetailPrice]);

  // Calculate retail price based on multiplier when not using manual price for Frame 2
  useEffect(() => {
    if (!frame2.useManualRetailPrice) {
      setFrame2({
        ...frame2,
        retailPrice: calculateRetailPrice(frame2.wholesaleCost, frame2.tariffTax, frame2.insuranceMultiplier)
      });
    }
  }, [frame2.wholesaleCost, frame2.tariffTax, frame2.insuranceMultiplier, frame2.useManualRetailPrice]);

  // Calculate profit data for Frame 1
  useEffect(() => {
    const frameData = {
      yourCost: frame1.yourCost,
      wholesaleCost: frame1.wholesaleCost,
      tariffTax: frame1.tariffTax,
      retailPrice: frame1.retailPrice,
      insuranceCoverage: frame1.insuranceCoverage,
      insuranceReimbursement: frame1.insuranceReimbursement
    };
    
    setFrame1(prev => ({
      ...prev,
      profitData: calculateProfit(
        frameData.yourCost,
        frameData.wholesaleCost,
        frameData.tariffTax,
        frameData.retailPrice,
        frameData.insuranceCoverage,
        frameData.insuranceReimbursement
      )
    }));
  }, [
    frame1.yourCost,
    frame1.wholesaleCost,
    frame1.tariffTax,
    frame1.retailPrice,
    frame1.insuranceCoverage,
    frame1.insuranceReimbursement
  ]);

  // Calculate profit data for Frame 2
  useEffect(() => {
    const frameData = {
      yourCost: frame2.yourCost,
      wholesaleCost: frame2.wholesaleCost,
      tariffTax: frame2.tariffTax,
      retailPrice: frame2.retailPrice,
      insuranceCoverage: frame2.insuranceCoverage,
      insuranceReimbursement: frame2.insuranceReimbursement
    };
    
    setFrame2(prev => ({
      ...prev,
      profitData: calculateProfit(
        frameData.yourCost,
        frameData.wholesaleCost,
        frameData.tariffTax,
        frameData.retailPrice,
        frameData.insuranceCoverage,
        frameData.insuranceReimbursement
      )
    }));
  }, [
    frame2.yourCost,
    frame2.wholesaleCost,
    frame2.tariffTax,
    frame2.retailPrice,
    frame2.insuranceCoverage,
    frame2.insuranceReimbursement
  ]);

  // Load companies from Supabase when component mounts
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoadingCompanies(true);
        setCompaniesError(null);
        const companiesData = await fetchCompaniesWithPricing();
        console.log('🔥 DEBUG: CompareFrames loaded companies:', companiesData);

        // Log brands with their pricing data
        companiesData.forEach(company => {
          console.log(`🔥 DEBUG: Company "${company.name}" has ${company.brands.length} brands:`);
          company.brands.forEach(brand => {
            console.log(`  - ${brand.name}: yourCost=${brand.yourCost}, wholesaleCost=${brand.wholesaleCost}, tariffTax=${brand.tariffTax}`);
          });
        });

        setCompanies(companiesData);
      } catch (error) {
        console.error('Error loading companies:', error);
        setCompaniesError('Failed to load companies. Please try again.');
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, []);

  // Save comparisons to localStorage when updated
  useEffect(() => {
    localStorage.setItem('optiprofit_comparisons', JSON.stringify(savedComparisons));
  }, [savedComparisons]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef1.current && !companyDropdownRef1.current.contains(event.target as Node)) {
        setShowCompanyDropdown1(false);
      }
      if (companyDropdownRef2.current && !companyDropdownRef2.current.contains(event.target as Node)) {
        setShowCompanyDropdown2(false);
      }
      if (brandDropdownRef1.current && !brandDropdownRef1.current.contains(event.target as Node)) {
        setShowBrandDropdown1(false);
      }
      if (brandDropdownRef2.current && !brandDropdownRef2.current.contains(event.target as Node)) {
        setShowBrandDropdown2(false);
      }
      if (saveDialogRef.current && !saveDialogRef.current.contains(event.target as Node)) {
        setShowSaveDialog(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handler for updating Frame 1 data
  const handleUpdateFrame1 = (field: keyof FrameData, value: any) => {
    setFrame1(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for updating Frame 2 data
  const handleUpdateFrame2 = (field: keyof FrameData, value: any) => {
    setFrame2(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler for selecting brand and auto-populating fields
  const handleBrandSelect1 = (company: Company, brand: Brand) => {
    setSelectedCompany1(company);
    setSelectedBrand1(brand);
    setFrame1(prev => ({
      ...prev,
      frameName: brand.name,
      brand: brand.name,
      companyId: company.id,
      companyName: company.name,
      yourCost: brand.yourCost || prev.yourCost,
      wholesaleCost: brand.wholesaleCost || prev.wholesaleCost,
      tariffTax: brand.tariffTax || prev.tariffTax,
      retailPrice: brand.retailPrice || prev.retailPrice,
      useManualRetailPrice: brand.retailPrice ? true : prev.useManualRetailPrice
    }));
    setShowBrandDropdown1(false);
  };

  const handleBrandSelect2 = (company: Company, brand: Brand) => {
    setSelectedCompany2(company);
    setSelectedBrand2(brand);
    setFrame2(prev => ({
      ...prev,
      frameName: brand.name,
      brand: brand.name,
      companyId: company.id,
      companyName: company.name,
      yourCost: brand.yourCost || prev.yourCost,
      wholesaleCost: brand.wholesaleCost || prev.wholesaleCost,
      tariffTax: brand.tariffTax || prev.tariffTax,
      retailPrice: brand.retailPrice || prev.retailPrice,
      useManualRetailPrice: brand.retailPrice ? true : prev.useManualRetailPrice
    }));
    setShowBrandDropdown2(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Compare Frame Profitability</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-demo="comparison-form">
          {/* Frame 1 Inputs */}
          <div className="bg-blue-50 p-4 rounded-lg">
            {/* Company Dropdown */}
            <div className="mb-4">
              <label htmlFor="company1" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <div className="relative" ref={companyDropdownRef1}>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    loadingCompanies ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !loadingCompanies && setShowCompanyDropdown1(!showCompanyDropdown1)}
                  disabled={loadingCompanies}
                >
                  <div className="flex items-center">
                    <BuildingIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>
                      {loadingCompanies
                        ? 'Loading companies...'
                        : selectedCompany1?.name || 'Select a company'}
                    </span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>

                {showCompanyDropdown1 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                    <ul className="py-1">
                      {loadingCompanies ? (
                        <li className="px-4 py-2 text-gray-500 text-sm">Loading companies...</li>
                      ) : companiesError ? (
                        <li className="px-4 py-2 text-red-500 text-sm">{companiesError}</li>
                      ) : companies.length === 0 ? (
                        <li className="px-4 py-2 text-gray-500 text-sm">
                          No companies available. Add companies in Vendors section.
                        </li>
                      ) : (
                        companies.map((company) => (
                          <li key={company.id}>
                            <button
                              type="button"
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedCompany1?.id === company.id ? 'bg-blue-50 text-blue-700' : ''}`}
                              onClick={() => {
                                setSelectedCompany1(company);
                                setSelectedBrand1(null);
                                setShowCompanyDropdown1(false);
                              }}
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
            
            {/* Brand Dropdown */}
            <div className="mb-4">
              <label htmlFor="brand1" className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <div className="relative" ref={brandDropdownRef1}>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !selectedCompany1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => selectedCompany1 && setShowBrandDropdown1(!showBrandDropdown1)}
                  disabled={!selectedCompany1}
                >
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{selectedBrand1?.name || (selectedCompany1 ? 'Select a brand' : 'Select company first')}</span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>
                
                {showBrandDropdown1 && selectedCompany1 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                    <ul className="py-1">
                      {selectedCompany1.brands.map((brand) => (
                        <li key={brand.id}>
                          <button
                            type="button"
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedBrand1?.id === brand.id ? 'bg-blue-50 text-blue-700' : ''}`}
                            onClick={() => handleBrandSelect1(selectedCompany1, brand)}
                          >
                            <div>
                              <div className="font-medium">{brand.name}</div>
                              {(brand.wholesaleCost || brand.yourCost) && (
                                <div className="text-xs text-gray-500">
                                  {brand.yourCost && `Your Cost: $${brand.yourCost}`}
                                  {brand.wholesaleCost && ` • Wholesale: $${brand.wholesaleCost}`}
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                      {selectedCompany1.brands.length === 0 && (
                        <li className="px-4 py-2 text-gray-500 text-sm">
                          No brands available for this company.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="yourCost1" className="block text-sm font-medium text-gray-700">
                  Your Actual Cost
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="yourCost1"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame1.yourCost}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame1('yourCost', parseFloat(value) || 0);
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="wholesaleCost1" className="block text-sm font-medium text-gray-700">
                  Wholesale Cost (Frame Book Price)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="wholesaleCost1"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame1.wholesaleCost}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame1('wholesaleCost', parseFloat(value) || 0);
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="tariffTax1" className="block text-sm font-medium text-gray-700">
                  Tariff Tax
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="tariffTax1"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame1.tariffTax}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame1('tariffTax', parseFloat(value) || 0);
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="insuranceMultiplier1" className="block text-sm font-medium text-gray-700 flex justify-between">
                  <span>Insurance Multiplier: {frame1.insuranceMultiplier.toFixed(1)}x</span>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useManualPrice1"
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={frame1.useManualRetailPrice}
                      onChange={(e) => handleUpdateFrame1('useManualRetailPrice', e.target.checked)}
                    />
                    <label htmlFor="useManualPrice1" className="text-xs text-gray-500">
                      Manual Price
                    </label>
                  </div>
                </label>
                {!frame1.useManualRetailPrice && (
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SlidersIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="range"
                      id="insuranceMultiplier1"
                      min="1"
                      max="4"
                      step="0.1"
                      className="block w-full pl-10 py-2"
                      value={frame1.insuranceMultiplier}
                      onChange={(e) => handleUpdateFrame1('insuranceMultiplier', parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between text-xs text-gray-400 px-3">
                      <span>1x</span>
                      <span>2x</span>
                      <span>3x</span>
                      <span>4x</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="retailPrice1" className="block text-sm font-medium text-gray-700">
                  Retail Price
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="retailPrice1"
                    className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${!frame1.useManualRetailPrice ? 'bg-gray-100' : ''}`}
                    value={frame1.retailPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame1('retailPrice', parseFloat(value) || 0);
                      if (!frame1.useManualRetailPrice) {
                        handleUpdateFrame1('useManualRetailPrice', true);
                      }
                    }}
                    readOnly={!frame1.useManualRetailPrice}
                  />
                </div>
                {!frame1.useManualRetailPrice && (
                  <p className="text-xs text-gray-500 italic">
                    Auto-calculated based on wholesale cost and multiplier
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="insuranceCoverage1" className="block text-sm font-medium text-gray-700">
                  Insurance Coverage Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="insuranceCoverage1"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame1.insuranceCoverage}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame1('insuranceCoverage', parseFloat(value) || 0);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {frame1.retailPrice > frame1.insuranceCoverage ? (
                    <>Patient will pay ${(frame1.retailPrice - frame1.insuranceCoverage).toFixed(2)} after 20% discount</>
                  ) : (
                    <>Insurance fully covers this frame</>
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="insuranceReimbursement1" className="block text-sm font-medium text-gray-700">
                  Insurance Reimbursement
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="insuranceReimbursement1"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame1.insuranceReimbursement}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame1('insuranceReimbursement', parseFloat(value) || 0);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 italic">
                  Typically $57 for most insurance providers
                </p>
              </div>
            </div>
          </div>
          
          {/* Frame 2 Inputs */}
          <div className="bg-green-50 p-4 rounded-lg">
            {/* Company Dropdown */}
            <div className="mb-4">
              <label htmlFor="company2" className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <div className="relative" ref={companyDropdownRef2}>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    loadingCompanies ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !loadingCompanies && setShowCompanyDropdown2(!showCompanyDropdown2)}
                  disabled={loadingCompanies}
                >
                  <div className="flex items-center">
                    <BuildingIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>
                      {loadingCompanies
                        ? 'Loading companies...'
                        : selectedCompany2?.name || 'Select a company'}
                    </span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>

                {showCompanyDropdown2 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                    <ul className="py-1">
                      {loadingCompanies ? (
                        <li className="px-4 py-2 text-gray-500 text-sm">Loading companies...</li>
                      ) : companiesError ? (
                        <li className="px-4 py-2 text-red-500 text-sm">{companiesError}</li>
                      ) : companies.length === 0 ? (
                        <li className="px-4 py-2 text-gray-500 text-sm">
                          No companies available. Add companies in Vendors section.
                        </li>
                      ) : (
                        companies.map((company) => (
                          <li key={company.id}>
                            <button
                              type="button"
                              className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedCompany2?.id === company.id ? 'bg-blue-50 text-blue-700' : ''}`}
                              onClick={() => {
                                setSelectedCompany2(company);
                                setSelectedBrand2(null);
                                setShowCompanyDropdown2(false);
                              }}
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
            
            {/* Brand Dropdown */}
            <div className="mb-4">
              <label htmlFor="brand2" className="block text-sm font-medium text-gray-700">
                Brand
              </label>
              <div className="relative" ref={brandDropdownRef2}>
                <button
                  type="button"
                  className={`w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    !selectedCompany2 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => selectedCompany2 && setShowBrandDropdown2(!showBrandDropdown2)}
                  disabled={!selectedCompany2}
                >
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>{selectedBrand2?.name || (selectedCompany2 ? 'Select a brand' : 'Select company first')}</span>
                  </div>
                  <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                </button>
                
                {showBrandDropdown2 && selectedCompany2 && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-auto">
                    <ul className="py-1">
                      {selectedCompany2.brands.map((brand) => (
                        <li key={brand.id}>
                          <button
                            type="button"
                            className={`w-full text-left px-4 py-2 hover:bg-gray-100 ${selectedBrand2?.id === brand.id ? 'bg-blue-50 text-blue-700' : ''}`}
                            onClick={() => handleBrandSelect2(selectedCompany2, brand)}
                          >
                            <div>
                              <div className="font-medium">{brand.name}</div>
                              {(brand.wholesaleCost || brand.yourCost) && (
                                <div className="text-xs text-gray-500">
                                  {brand.yourCost && `Your Cost: $${brand.yourCost}`}
                                  {brand.wholesaleCost && ` • Wholesale: $${brand.wholesaleCost}`}
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                      {selectedCompany2.brands.length === 0 && (
                        <li className="px-4 py-2 text-gray-500 text-sm">
                          No brands available for this company.
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="yourCost2" className="block text-sm font-medium text-gray-700">
                  Your Actual Cost
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="yourCost2"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame2.yourCost}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame2('yourCost', parseFloat(value) || 0);
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="wholesaleCost2" className="block text-sm font-medium text-gray-700">
                  Wholesale Cost (Frame Book Price)
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="wholesaleCost2"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame2.wholesaleCost}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame2('wholesaleCost', parseFloat(value) || 0);
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="tariffTax2" className="block text-sm font-medium text-gray-700">
                  Tariff Tax
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="tariffTax2"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame2.tariffTax}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame2('tariffTax', parseFloat(value) || 0);
                    }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="insuranceMultiplier2" className="block text-sm font-medium text-gray-700 flex justify-between">
                  <span>Insurance Multiplier: {frame2.insuranceMultiplier.toFixed(1)}x</span>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useManualPrice2"
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={frame2.useManualRetailPrice}
                      onChange={(e) => handleUpdateFrame2('useManualRetailPrice', e.target.checked)}
                    />
                    <label htmlFor="useManualPrice2" className="text-xs text-gray-500">
                      Manual Price
                    </label>
                  </div>
                </label>
                {!frame2.useManualRetailPrice && (
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SlidersIcon className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="range"
                      id="insuranceMultiplier2"
                      min="1"
                      max="4"
                      step="0.1"
                      className="block w-full pl-10 py-2"
                      value={frame2.insuranceMultiplier}
                      onChange={(e) => handleUpdateFrame2('insuranceMultiplier', parseFloat(e.target.value))}
                    />
                    <div className="flex justify-between text-xs text-gray-400 px-3">
                      <span>1x</span>
                      <span>2x</span>
                      <span>3x</span>
                      <span>4x</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="retailPrice2" className="block text-sm font-medium text-gray-700">
                  Retail Price
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="retailPrice2"
                    className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${!frame2.useManualRetailPrice ? 'bg-gray-100' : ''}`}
                    value={frame2.retailPrice}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame2('retailPrice', parseFloat(value) || 0);
                      if (!frame2.useManualRetailPrice) {
                        handleUpdateFrame2('useManualRetailPrice', true);
                      }
                    }}
                    readOnly={!frame2.useManualRetailPrice}
                  />
                </div>
                {!frame2.useManualRetailPrice && (
                  <p className="text-xs text-gray-500 italic">
                    Auto-calculated based on wholesale cost and multiplier
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="insuranceCoverage2" className="block text-sm font-medium text-gray-700">
                  Insurance Coverage Amount
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="insuranceCoverage2"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame2.insuranceCoverage}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame2('insuranceCoverage', parseFloat(value) || 0);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {frame2.retailPrice > frame2.insuranceCoverage ? (
                    <>Patient will pay ${(frame2.retailPrice - frame2.insuranceCoverage).toFixed(2)} after 20% discount</>
                  ) : (
                    <>Insurance fully covers this frame</>
                  )}
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="insuranceReimbursement2" className="block text-sm font-medium text-gray-700">
                  Insurance Reimbursement
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSignIcon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    id="insuranceReimbursement2"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={frame2.insuranceReimbursement}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+(?=\d)/, '');
                      handleUpdateFrame2('insuranceReimbursement', parseFloat(value) || 0);
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 italic">
                  Typically $57 for most insurance providers
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Comparison Results */}
        {frame1.profitData && frame2.profitData && (
          <div className="mt-8" data-demo="comparison-display">
            <FrameComparisonDisplay 
              frame1={frame1}
              frame2={frame2}
            />
          </div>
        )}

        {/* Save Comparison Button */}
        {frame1.profitData && frame2.profitData && (
          <div className="mt-6 flex space-x-3">
            <button
              onClick={() => {
                setSaveComparisonName(`${frame1.frameName} vs ${frame2.frameName}`);
                setShowSaveDialog(true);
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <SaveIcon className="h-4 w-4 mr-2" />
              Save Comparison
            </button>
          </div>
        )}
        
        
        {/* Save Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div ref={saveDialogRef} className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Save Frame Comparison</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="comparisonName" className="block text-sm font-medium text-gray-700 mb-1">
                    Comparison Name
                  </label>
                  <input
                    type="text"
                    id="comparisonName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter a name"
                    value={saveComparisonName}
                    onChange={(e) => setSaveComparisonName(e.target.value)}
                    autoFocus
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Frame 1</h4>
                    <div className="text-sm">
                      <p><span className="font-medium">{frame1.frameName}</span></p>
                      {frame1.brand && <p className="text-gray-500">{frame1.brand}</p>}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Frame 2</h4>
                    <div className="text-sm">
                      <p><span className="font-medium">{frame2.frameName}</span></p>
                      {frame2.brand && <p className="text-gray-500">{frame2.brand}</p>}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => setShowSaveDialog(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => {
                      if (frame1.profitData && frame2.profitData) {
                        const newComparison: SavedComparison = {
                          id: Date.now(),
                          name: saveComparisonName.trim() || `${frame1.frameName} vs ${frame2.frameName}`,
                          date: new Date().toLocaleDateString(),
                          frame1: {
                            frameName: frame1.frameName,
                            brand: frame1.brand,
                            yourCost: frame1.yourCost,
                            wholesaleCost: frame1.wholesaleCost,
                            tariffTax: frame1.tariffTax,
                            retailPrice: frame1.retailPrice,
                            insuranceCoverage: frame1.insuranceCoverage,
                            insuranceReimbursement: frame1.insuranceReimbursement,
                            profit: frame1.profitData.profit,
                            margin: frame1.profitData.profitMargin
                          },
                          frame2: {
                            frameName: frame2.frameName,
                            brand: frame2.brand,
                            yourCost: frame2.yourCost,
                            wholesaleCost: frame2.wholesaleCost,
                            tariffTax: frame2.tariffTax,
                            retailPrice: frame2.retailPrice,
                            insuranceCoverage: frame2.insuranceCoverage,
                            insuranceReimbursement: frame2.insuranceReimbursement,
                            profit: frame2.profitData.profit,
                            margin: frame2.profitData.profitMargin
                          }
                        };
                        setSavedComparisons(prev => [...prev, newComparison]);
                        setShowSaveDialog(false);
                        setSaveComparisonName('');
                      }
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Saved Comparisons */}
        {savedComparisons.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Saved Comparisons</h3>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {savedComparisons.map((comparison) => (
                  <li 
                    key={comparison.id}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      setFrame1({
                        frameName: comparison.frame1.frameName,
                        brand: comparison.frame1.brand,
                        yourCost: comparison.frame1.yourCost,
                        wholesaleCost: comparison.frame1.wholesaleCost,
                        tariffTax: comparison.frame1.tariffTax || 0, // Handle older comparisons
                        retailPrice: comparison.frame1.retailPrice,
                        insuranceMultiplier: comparison.frame1.wholesaleCost > 0 ? 
                          parseFloat((comparison.frame1.retailPrice / comparison.frame1.wholesaleCost).toFixed(1)) : 2.5,
                        useManualRetailPrice: true,
                        insuranceCoverage: comparison.frame1.insuranceCoverage,
                        insuranceReimbursement: comparison.frame1.insuranceReimbursement,
                        profitData: null // This will be recalculated by the useEffect
                      });
                      
                      setFrame2({
                        frameName: comparison.frame2.frameName,
                        brand: comparison.frame2.brand,
                        yourCost: comparison.frame2.yourCost,
                        wholesaleCost: comparison.frame2.wholesaleCost,
                        tariffTax: comparison.frame2.tariffTax || 0, // Handle older comparisons
                        retailPrice: comparison.frame2.retailPrice,
                        insuranceMultiplier: comparison.frame2.wholesaleCost > 0 ? 
                          parseFloat((comparison.frame2.retailPrice / comparison.frame2.wholesaleCost).toFixed(1)) : 2.5,
                        useManualRetailPrice: true,
                        insuranceCoverage: comparison.frame2.insuranceCoverage,
                        insuranceReimbursement: comparison.frame2.insuranceReimbursement,
                        profitData: null // This will be recalculated by the useEffect
                      });
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{comparison.name}</h4>
                        <div className="mt-1 flex items-center text-xs text-gray-500">
                          <span>{comparison.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="text-xs bg-blue-50 p-2 rounded">
                        <div className="font-medium">{comparison.frame1.frameName}</div>
                        <div className="text-gray-600">{comparison.frame1.brand}</div>
                        <div className="mt-1">
                          Profit: {formatCurrency(comparison.frame1.profit)} ({comparison.frame1.margin}%)
                        </div>
                      </div>
                      <div className="text-xs bg-green-50 p-2 rounded">
                        <div className="font-medium">{comparison.frame2.frameName}</div>
                        <div className="text-gray-600">{comparison.frame2.brand}</div>
                        <div className="mt-1">
                          Profit: {formatCurrency(comparison.frame2.profit)} ({comparison.frame2.margin}%)
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default CompareFrames;
