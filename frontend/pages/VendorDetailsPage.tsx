import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package, ArrowLeft, Loader2, Box, BarChart3, DollarSign,
  TrendingUp, ShoppingCart, Percent, Grid3x3, Search, Tag
} from 'lucide-react';
import { Container } from '../components/ui/Container';
import { fetchVendors, Vendor } from '../services/api';
import { getBrandName } from '../utils/brandNames';

interface BrandAnalytics {
  brand: string;
  productCount: number;
  modelCount: number;
  totalOrders: number;
  avgWholesaleCost: number | null;
  avgMsrp: number | null;
  minWholesaleCost: number | null;
  maxWholesaleCost: number | null;
  inStockCount: number;
  inStockPercentage: number;
}

interface VendorCatalogData {
  vendorId: string;
  vendorName: string;
  totalProducts: number;
  totalBrands: number;
  totalOrders: number;
  avgWholesaleCost: number | null;
  brands: BrandAnalytics[];
}

interface VendorData extends Vendor {
  minOrder: string;
  paymentTerms: string;
  buyingGroups: string;
}

const VendorDetailsPage: React.FC = () => {
  const { vendorId } = useParams<{ vendorId: string }>();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<VendorData | null>(null);
  const [catalogData, setCatalogData] = useState<VendorCatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      if (!vendorId) return;

      try {
        setLoading(true);

        // Load vendor info
        const vendors = await fetchVendors();
        const vendorInfo = vendors.find(v => v.id === vendorId);

        if (vendorInfo) {
          setVendor({
            ...vendorInfo,
            minOrder: vendorInfo.min_order || "Contact for pricing",
            paymentTerms: vendorInfo.payment_terms || "NET 30",
            buyingGroups: vendorInfo.buying_groups || "Not specified"
          });
        }

        // Load catalog data
        const baseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
        const apiUrl = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
        const response = await fetch(`${apiUrl}/catalog/vendor/${vendorId}`);
        const data = await response.json();

        if (data.success) {
          setCatalogData(data);
        }
      } catch (error) {
        console.error('Error loading vendor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [vendorId]);

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return 'N/A';
    return `$${amount.toFixed(2)}`;
  };

  const filteredBrands = catalogData?.brands.filter(brand =>
    brand.brand.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Ultra-Premium':
        return 'from-purple-500 to-purple-700';
      case 'Premium':
        return 'from-blue-500 to-blue-700';
      case 'Mid-Tier':
        return 'from-green-500 to-green-700';
      case 'Value':
        return 'from-yellow-500 to-yellow-700';
      case 'Boutique':
        return 'from-pink-500 to-pink-700';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-[#181F1C] dark:to-blue-950/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">Loading vendor data...</span>
        </div>
      </div>
    );
  }

  if (!vendor || !catalogData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-[#181F1C] dark:to-blue-950/30 flex items-center justify-center">
        <div className="text-center">
          <Box className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vendor Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">The vendor you're looking for doesn't exist or has no catalog data.</p>
          <button
            onClick={() => navigate('/vendor-comparison')}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            Back to Vendor Comparison
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-[#181F1C] dark:to-blue-950/30">
      <div className="p-6 md:p-8">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Header */}
            <div className="mb-8">
              <button
                onClick={() => navigate('/vendor-comparison')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white mb-6 font-medium transition-colors group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back to Vendor Comparison
              </button>

              <div className={`bg-gradient-to-r ${getSegmentColor(vendor.segment)} rounded-3xl shadow-2xl p-8 md:p-12 text-white relative overflow-hidden`}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-48 -translate-y-48" />
                <div className="relative">
                  <div className="flex items-center gap-6 mb-6">
                    <div className="p-6 bg-white/20 backdrop-blur-sm rounded-3xl">
                      <Package className="h-16 w-16" />
                    </div>
                    <div>
                      <h1 className="text-4xl md:text-5xl font-bold mb-2">{vendor.name}</h1>
                      <p className="text-xl text-white/90">Vendor Catalog & Pricing Analysis</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="text-white/80 text-sm font-medium mb-2">Segment</div>
                      <div className="text-white font-bold text-2xl">{vendor.segment}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="text-white/80 text-sm font-medium mb-2">Discount</div>
                      <div className="text-white font-bold text-2xl">{vendor.discount}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="text-white/80 text-sm font-medium mb-2">Min Order</div>
                      <div className="text-white font-bold text-2xl">{vendor.minOrder}</div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
                      <div className="text-white/80 text-sm font-medium mb-2">Payment</div>
                      <div className="text-white font-bold text-2xl">{vendor.paymentTerms}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-[#1F2623]/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 mb-8"
            >
              <div className="flex items-center gap-3 mb-6">
                <Tag className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Brands</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                {catalogData.brands.map((brand, index) => (
                  <motion.div
                    key={brand.brand}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all cursor-pointer"
                    onClick={() => setSearchTerm(brand.brand)}
                  >
                    {getBrandName(brand.brand)}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Catalog Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/30 rounded-3xl p-8 border-2 border-blue-200 dark:border-blue-800 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <Box className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-5xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                  {catalogData.totalProducts.toLocaleString()}
                </div>
                <div className="text-blue-700 dark:text-blue-300 font-semibold text-lg">Total Products</div>
                <div className="text-blue-600 dark:text-blue-400 text-sm mt-2">Unique SKUs in catalog</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/30 rounded-3xl p-8 border-2 border-purple-200 dark:border-purple-800 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <Grid3x3 className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-5xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                  {catalogData.totalBrands}
                </div>
                <div className="text-purple-700 dark:text-purple-300 font-semibold text-lg">Brands</div>
                <div className="text-purple-600 dark:text-purple-400 text-sm mt-2">Different brand lines</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/30 rounded-3xl p-8 border-2 border-amber-200 dark:border-amber-800 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-12 w-12 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-5xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                  {formatCurrency(catalogData.avgWholesaleCost)}
                </div>
                <div className="text-amber-700 dark:text-amber-300 font-semibold text-lg">Avg Wholesale</div>
                <div className="text-amber-600 dark:text-amber-400 text-sm mt-2">Average cost per unit</div>
              </motion.div>
            </div>

            {/* Brand Breakdown Section */}
            <div className="bg-white/80 dark:bg-[#1F2623]/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                    <Package className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Brand Breakdown</h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">Detailed analytics for each brand</p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search brands..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#1F2623] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 rounded-xl w-64 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {filteredBrands.map((brand, index) => (
                  <motion.div
                    key={brand.brand}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white dark:bg-[#1F2623] border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-8 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {getBrandName(brand.brand)}
                        </h3>
                        <div className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
                          <span className="flex items-center gap-1">
                            <Grid3x3 className="h-4 w-4" />
                            {brand.modelCount} models
                          </span>
                          <span className="flex items-center gap-1">
                            <Box className="h-4 w-4" />
                            {brand.productCount} variants
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                          {formatCurrency(brand.avgWholesaleCost)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avg Wholesale Cost</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Price Range
                        </div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(brand.minWholesaleCost)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">to {formatCurrency(brand.maxWholesaleCost)}</div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 rounded-xl p-4">
                        <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Avg MSRP
                        </div>
                        <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {formatCurrency(brand.avgMsrp)}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">Retail price</div>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 rounded-xl p-4">
                        <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-2 flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          In Stock
                        </div>
                        <div className="text-lg font-bold text-green-900 dark:text-green-100">
                          {brand.inStockPercentage}%
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">{brand.inStockCount} units</div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 rounded-xl p-4">
                        <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2 flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          Total SKUs
                        </div>
                        <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                          {brand.productCount}
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">Product variants</div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {filteredBrands.length === 0 && (
                  <div className="text-center py-16">
                    <Search className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No brands found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your search term</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </Container>
      </div>
    </div>
  );
};

export default VendorDetailsPage;
