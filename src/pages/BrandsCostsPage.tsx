import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Container } from '../components/ui/Container';
import CompanyCard from '../components/brands/CompanyCard';
import BrandDetailsModal from '../components/brands/BrandDetailsModal';
import CompanyDetailsModal from '../components/brands/CompanyDetailsModal';
import AddCompanyModal from '../components/brands/AddCompanyModal';
import { Company, Brand } from '../types';
import { fetchCompaniesWithPricing, saveUserVendorPricing } from '../services/api';

// Function to load companies from Supabase (replacing localStorage approach)
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

  // Load companies from Supabase on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        const companiesData = await loadCompaniesFromSupabase();
        setCompanies(companiesData);
      } catch (err) {
        console.error('Error loading companies:', err);
        setError('Failed to load company data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

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
    }
  };

  const handleSaveBrand = async (updatedBrand: Brand) => {
    try {
      // Save to Supabase
      await saveUserVendorPricing({
        brand_id: updatedBrand.id,
        wholesale_cost: updatedBrand.wholesaleCost,
        your_cost: updatedBrand.yourCost,
        tariff_tax: updatedBrand.tariffTax || 0
      });

      // Update local state
      setCompanies(prevCompanies => 
        prevCompanies.map(company => ({
          ...company,
          brands: company.brands.map(brand => 
            brand.id === updatedBrand.id ? updatedBrand : brand
          )
        }))
      );
    } catch (error) {
      console.error('Error saving brand:', error);
      setError('Failed to save brand changes. Please try again.');
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
    <div className="h-full bg-gray-50">
      <div className="p-6 md:p-8">
        <Container>
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Vendors
              </h1>
              <p className="text-lg text-gray-600">
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

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                <span className="text-gray-600">Loading company data...</span>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center mb-8">
              <div className="text-red-600 font-medium mb-2">Error Loading Companies</div>
              <div className="text-red-500 text-sm mb-4">{error}</div>
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
                    data-demo={index === 0 ? "company-card" : undefined}
                  >
                    <CompanyCard
                      company={company}
                      onViewBrandDetails={handleViewBrandDetails}
                      onEditCompany={handleEditCompany}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Search className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No companies found</h3>
                  <p className="text-gray-500">
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
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
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
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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