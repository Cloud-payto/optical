import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Container } from '../components/ui/Container';
import CompanyCard from '../components/brands/CompanyCard';
import BrandDetailsModal from '../components/brands/BrandDetailsModal';
import CompanyDetailsModal from '../components/brands/CompanyDetailsModal';
import AddCompanyModal from '../components/brands/AddCompanyModal';
import MissingBrands from '../components/brands/MissingBrands';
import ImportFromInventory from '../components/brands/ImportFromInventory';
import { Company, Brand } from '../types';
import { fetchCompaniesWithPricing, saveAccountBrand } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useDemo } from '../hooks/useDemo';
import { DEMO_DATA_IDS } from '../demo/demoConstants';

// Function to load companies with account-specific brand data from Supabase
const loadCompaniesFromSupabase = async (): Promise<Company[]> => {
  try {
    const companies = await fetchCompaniesWithPricing();
    return companies;
  } catch (error) {
    console.error('Error loading companies from Supabase:', error);
    return [];
  }
};

const BrandsCostsPage: React.FC = () => {
  const { user } = useAuth();
  const { isActive: isDemo, demoData } = useDemo();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<{ brand: Brand; companyName: string } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 6;

  // Load companies function
  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isDemo) {
        console.log('🎭 Demo mode: Loading demo vendor data from API');

        // Clear any existing real user data
        setCompanies([]);

        // Fetch data from API (will automatically use demo user ID via api.ts)
        const companiesData = await loadCompaniesFromSupabase();

        console.log('📊 API returned companies:', companiesData.map(c => c.name));

        // Filter to show ONLY Modern Optical in demo mode
        const modernOptical = companiesData.find(c =>
          c.name === 'Modern Optical' ||
          c.id === DEMO_DATA_IDS.VENDOR_ID
        );

        if (modernOptical) {
          console.log('✅ Found Modern Optical:', modernOptical);
          setCompanies([modernOptical]); // Show only demo vendor
        } else {
          console.warn('⚠️ Modern Optical not found in API response, using all companies');
          setCompanies(companiesData); // Fallback to all companies
        }
      } else {
        // Normal mode: Load user's real vendors
        const companiesData = await loadCompaniesFromSupabase();
        setCompanies(companiesData);
      }
    } catch (err) {
      console.error('Error loading companies:', err);
      setError('Failed to load company data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load companies from Supabase on component mount or when demo state changes
  useEffect(() => {
    loadCompanies();
  }, [isDemo]); // Only depend on isDemo flag, not mock data

  // Debug effect to track demo state changes
  useEffect(() => {
    console.log('🎭 BrandsCostsPage Demo State:', {
      isDemo,
      hasDemoData: !!demoData,
      companiesCount: companies.length,
      companies: companies.map(c => ({ id: c.id, name: c.name, brandCount: c.brands.length }))
    });
  }, [isDemo, demoData, companies]);

  // Filter companies based on search term
  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    
    return companies.filter(company => 
      company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.brands.some(brand => 
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, companies]);

  // Pagination logic
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + itemsPerPage);

  const handleViewBrandDetails = (companyId: string, brandId: string) => {
    const company = companies.find(c => c.id === companyId);
    const brand = company?.brands.find(b => b.id === brandId);
    
    if (brand && company) {
      setSelectedBrand({ brand, companyName: company.name });
      setIsBrandModalOpen(true);
    }
  };

  const handleEditCompany = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (company) {
      setSelectedCompany(company);
      setIsCompanyModalOpen(true);

      // Notify demo system that user clicked Edit
      if (isDemo) {
        notifyUserAction('click', { companyId });
      }
    }
  };

  const handleSaveBrand = async (updatedBrand: Brand) => {
    try {
      // Find the company (vendor) that contains this brand
      const company = companies.find(c => c.brands.some(b => b.id === updatedBrand.id));
      if (!company) {
        throw new Error('Could not find vendor for this brand');
      }

      // Check if this is a new brand (invalid concatenated ID) or existing brand
      const isNewBrand = !updatedBrand.id || updatedBrand.id.includes('-' + company.id) || updatedBrand.id.length > 36;
      
      const dataToSend = {
        // For new brands, send name instead of invalid ID
        ...(isNewBrand ? {
          brand_name: updatedBrand.name,
          brand_id: undefined // Don't send invalid ID
        } : {
          brand_id: updatedBrand.id, // Send valid existing ID
          brand_name: undefined
        }),
        vendor_id: company.id,
        // Save global wholesale cost if it has changed
        global_wholesale_cost: updatedBrand.wholesaleCost,
        // Save MSRP (retail price) to brands table
        msrp: updatedBrand.retailPrice || 0,
        // Save account-specific wholesale cost (negotiated price)
        wholesale_cost: updatedBrand.yourCost || updatedBrand.wholesaleCost,
        tariff_tax: updatedBrand.tariffTax || 0,
        discount_percentage: 0, // Default value
        notes: updatedBrand.notes || ''
      };

      // Save to Supabase with correct data structure
      const result = await saveAccountBrand(dataToSend);

      // Update local state - handle both existing and new brands
      setCompanies(prevCompanies => 
        prevCompanies.map(comp => {
          if (comp.id === company.id) {
            return {
              ...comp,
              brands: comp.brands.map(brand => {
                if (isNewBrand) {
                  // For new brands, match by name (since ID was invalid)
                  if (brand.name === updatedBrand.name) {
                    return {
                      ...updatedBrand,
                      id: result.data?.brand_id || result.brand_id || brand.id // Use real ID from DB
                    };
                  }
                } else {
                  // For existing brands, match by ID
                  if (brand.id === updatedBrand.id) {
                    return updatedBrand;
                  }
                }
                return brand;
              })
            };
          }
          return comp;
        })
      );
    } catch (error) {
      console.error('Error saving brand:', error);
      if (error.message.includes('Could not find vendor')) {
        setError('Error: Could not find the vendor for this brand. Please refresh the page and try again.');
      } else if (error.response?.data?.error) {
        setError(`Failed to save brand changes: ${error.response.data.error}`);
      } else {
        setError('Failed to save brand changes. Please check your internet connection and try again.');
      }
    }
  };

  const handleSaveCompany = async (updatedCompany: Company) => {
    try {
      // For now, just update local state since vendor company info
      // is more complex to save than individual brand pricing
      setCompanies(prevCompanies => 
        prevCompanies.map(company => 
          company.id === updatedCompany.id ? updatedCompany : company
        )
      );
    } catch (error) {
      console.error('Error saving company:', error);
      setError('Failed to save company changes. Please try again.');
    }
  };

  const handleAddNewCompany = () => {
    setIsAddCompanyModalOpen(true);
  };

  const handleSaveNewCompany = async (newCompany: Company) => {
    try {
      // For now, just update local state since adding new vendors
      // requires more complex database operations
      setCompanies(prevCompanies => [...prevCompanies, newCompany]);
    } catch (error) {
      console.error('Error adding new company:', error);
      setError('Failed to add new company. Please try again.');
    }
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-[#181F1C]">
      <div className="p-6 md:p-8">
        <Container>
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Vendors
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Manage optical vendors, their brands, and associated costs.
              </p>
            </div>
            <button
              onClick={handleAddNewCompany}
              data-demo="add-company-btn"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add New Company
            </button>
          </div>

          {/* Import from Inventory Section */}
          {user?.id && <ImportFromInventory onImportComplete={loadCompanies} />}

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-[#1F2623] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Search for brands or companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-gray-600 dark:text-gray-300">Loading company data...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center mb-8">
              <div className="text-red-600 dark:text-red-400 font-medium mb-2">Error Loading Companies</div>
              <div className="text-red-500 dark:text-red-300 text-sm mb-4">{error}</div>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Company Cards */}
          {!loading && !error && (
            <div className="space-y-4 mb-8">
              {paginatedCompanies.length > 0 ? (
                paginatedCompanies.map((company, index) => (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="space-y-3"
                  >
                    <CompanyCard
                      company={company}
                      onViewBrandDetails={handleViewBrandDetails}
                      onEditCompany={handleEditCompany}
                      isDemo={isDemo && (company.name === 'Modern Optical' || company.id === DEMO_DATA_IDS.VENDOR_ID)}
                    />
                    {user?.id && (
                      <MissingBrands
                        vendorId={company.id}
                        vendorName={company.name}
                        userId={user.id}
                        onBrandsAdded={loadCompanies}
                      />
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-600 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No companies found</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm
                      ? `No companies or brands match "${searchTerm}"`
                      : 'No companies available'
                    }
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1F2623] px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F2623] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1F2623] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{' '}
                    <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(startIndex + itemsPerPage, filteredCompanies.length)}
                    </span>{' '}
                    of <span className="font-medium">{filteredCompanies.length}</span> companies
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          page === currentPage
                            ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                            : 'text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </Container>
      </div>

      {/* Modals */}
      <BrandDetailsModal
        isOpen={isBrandModalOpen}
        onClose={() => setIsBrandModalOpen(false)}
        brand={selectedBrand?.brand || null}
        companyName={selectedBrand?.companyName || ''}
        onSave={handleSaveBrand}
      />

      <CompanyDetailsModal
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
        company={selectedCompany}
        onSave={handleSaveCompany}
      />

      <AddCompanyModal
        isOpen={isAddCompanyModalOpen}
        onClose={() => setIsAddCompanyModalOpen(false)}
        onSave={handleSaveNewCompany}
      />
    </div>
  );
};

export default BrandsCostsPage;