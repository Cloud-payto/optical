import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '../components/ui/Container';
import CompanyCard from '../components/brands/CompanyCard';
import BrandDetailsModal from '../components/brands/BrandDetailsModal';
import CompanyDetailsModal from '../components/brands/CompanyDetailsModal';
import AddCompanyModal from '../components/brands/AddCompanyModal';
import { Company, Brand } from '../types';

// Sample data
const initialCompanies: Company[] = [
  {
    id: '1',
    name: 'Modern Optical',
    brands: [
      { id: '1-1', name: 'MODERN TIMES', wholesaleCost: 85.00, yourCost: 7.50, tariffTax: 2.50 },
      { id: '1-2', name: 'MODERN METALS', wholesaleCost: 120.00, yourCost: 12.00, tariffTax: 4.00 }
    ],
    contactInfo: {
      companyEmail: 'contact@modernoptical.com',
      companyPhone: '(555) 123-4567',
      supportEmail: 'support@modernoptical.com',
      supportPhone: '(555) 123-4568',
      website: 'https://www.modernoptical.com',
      repName: 'Sarah Johnson',
      repEmail: 'sarah.johnson@modernoptical.com',
      repPhone: '(555) 123-4569'
    }
  },
  {
    id: '2',
    name: 'ClearVision',
    brands: [
      { id: '2-1', name: 'ClearView Classic', wholesaleCost: 65.00, yourCost: 6.00 },
      { id: '2-2', name: 'ClearView Sport', wholesaleCost: 75.00, yourCost: 7.50 },
      { id: '2-3', name: 'ClearView Designer', wholesaleCost: 95.00, yourCost: 9.50 }
    ],
    contactInfo: {
      companyEmail: 'info@clearvision.com',
      supportEmail: 'support@clearvision.com',
      website: 'https://www.clearvision.com',
      repName: 'Mike Chen',
      repEmail: 'mike.chen@clearvision.com',
      repPhone: '(555) 234-5678'
    }
  },
  {
    id: '3',
    name: 'Luxottica',
    brands: [
      { id: '3-1', name: 'Ray-Ban', wholesaleCost: 150.00, yourCost: 15.00, tariffTax: 6.00 }
    ],
    contactInfo: {
      companyEmail: 'orders@luxottica.com',
      companyPhone: '(555) 987-6543',
      supportEmail: 'support@luxottica.com',
      supportPhone: '(555) 987-6544',
      website: 'https://www.luxottica.com',
      repName: 'David Rodriguez',
      repEmail: 'david.rodriguez@luxottica.com',
      repPhone: '(555) 987-6545'
    }
  },
  {
    id: '4',
    name: 'Safilo',
    brands: [
      { id: '4-1', name: 'Safilo Collection', wholesaleCost: 110.00, yourCost: 11.00 },
      { id: '4-2', name: 'Safilo Premium', wholesaleCost: 140.00, yourCost: 14.00, tariffTax: 5.50 }
    ],
    contactInfo: {
      companyEmail: 'contact@safilo.com',
      website: 'https://www.safilo.com',
      repName: 'Anna Thompson',
      repEmail: 'anna.thompson@safilo.com',
      repPhone: '(555) 345-6789'
    }
  }
];

// Function to load companies from localStorage or use default data
const loadSavedCompanies = (): Company[] => {
  const savedCompanies = localStorage.getItem('optiprofit_companies');
  return savedCompanies ? JSON.parse(savedCompanies) : initialCompanies;
};

const BrandsCostsPage: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>(loadSavedCompanies());
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBrand, setSelectedBrand] = useState<{ brand: Brand; companyName: string } | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false);
  const itemsPerPage = 6;

  // Save companies to localStorage when updated
  useEffect(() => {
    localStorage.setItem('optiprofit_companies', JSON.stringify(companies));
  }, [companies]);

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

  const handleSaveBrand = (updatedBrand: Brand) => {
    setCompanies(prevCompanies => 
      prevCompanies.map(company => ({
        ...company,
        brands: company.brands.map(brand => 
          brand.id === updatedBrand.id ? updatedBrand : brand
        )
      }))
    );
  };

  const handleSaveCompany = (updatedCompany: Company) => {
    setCompanies(prevCompanies => 
      prevCompanies.map(company => 
        company.id === updatedCompany.id ? updatedCompany : company
      )
    );
  };

  const handleAddNewCompany = () => {
    setIsAddCompanyModalOpen(true);
  };

  const handleSaveNewCompany = (newCompany: Company) => {
    setCompanies(prevCompanies => [...prevCompanies, newCompany]);
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

          {/* Company Cards */}
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