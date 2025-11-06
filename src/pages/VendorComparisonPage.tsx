import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronDown, Check, Star, TrendingUp, Loader2 } from 'lucide-react';
import { Container } from '../components/ui/Container';
import { fetchVendors, Vendor } from '../services/api';
import { getBrandName, VENDOR_BRANDS } from '../utils/brandNames';

interface VendorDisplayData extends Vendor {
  id: number | string;
  minOrder: string;
  paymentTerms: string;
  buyingGroups: string;
}

const segments = ["All", "Premium", "Ultra-Premium", "Mid-Tier", "Value", "Boutique"];

const VendorComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<VendorDisplayData[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<VendorDisplayData[]>([]);
  const [selectedSegment, setSelectedSegment] = useState("All");
  const [sortBy, setSortBy] = useState("name");
  const [selectedVendors, setSelectedVendors] = useState<Set<number | string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load vendors from Supabase
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        setError(null);
        const vendorData = await fetchVendors();

        // Transform vendor data to match VendorDisplayData interface
        const transformedVendors: VendorDisplayData[] = vendorData.map(vendor => ({
          ...vendor,
          minOrder: vendor.min_order || "Contact for pricing",
          paymentTerms: vendor.payment_terms || "NET 30",
          buyingGroups: vendor.buying_groups || "Not specified"
        }));

        setVendors(transformedVendors);
      } catch (err) {
        console.error('Error loading vendors:', err);
        setError('Failed to load vendor data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadVendors();
  }, []);

  // Filter and sort vendors
  useEffect(() => {
    let filtered = selectedSegment === "All"
      ? vendors
      : vendors.filter(v => v.segment === selectedSegment);

    // Sort the filtered vendors
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'segment':
          return a.segment.localeCompare(b.segment);
        case 'minOrder':
          // Basic sorting by extracting first number from min order string
          const getMinOrderValue = (order: string) => {
            const match = order.match(/\$?(\d+)/);
            return match ? parseInt(match[1]) : 0;
          };
          return getMinOrderValue(a.minOrder) - getMinOrderValue(b.minOrder);
        default:
          return 0;
      }
    });

    setFilteredVendors(sorted);
  }, [selectedSegment, sortBy, vendors]);

  const toggleVendorSelection = (vendorId: number | string) => {
    const newSelected = new Set(selectedVendors);
    if (newSelected.has(vendorId)) {
      newSelected.delete(vendorId);
    } else {
      newSelected.add(vendorId);
    }
    setSelectedVendors(newSelected);
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Ultra-Premium':
        return 'bg-purple-100 text-purple-800';
      case 'Premium':
        return 'bg-blue-100 text-blue-800';
      case 'Mid-Tier':
        return 'bg-green-100 text-green-800';
      case 'Value':
        return 'bg-yellow-100 text-yellow-800';
      case 'Boutique':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="p-6 md:p-8">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Vendor Comparison
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Compare frame vendors and their pricing structures
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Controls Section */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4">
                    <div className="relative">
                      <select
                        value={selectedSegment}
                        onChange={(e) => setSelectedSegment(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        {segments.map(segment => (
                          <option key={segment} value={segment}>
                            {segment === "All" ? "All Segments" : segment}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="segment">Sort by Segment</option>
                        <option value="minOrder">Sort by Min Order</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="text-sm font-medium text-gray-600">
                    Showing <span className="text-blue-600 font-bold">{filteredVendors.length}</span> vendors
                  </div>
                </div>

                {selectedVendors.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100"
                  >
                    <span className="text-sm font-semibold text-blue-900">
                      {selectedVendors.size} vendor(s) selected for comparison
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Market Insights Banner */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                    <TrendingUp className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">Market Insights</h3>
                    <p className="text-blue-100 text-sm leading-relaxed">
                      Premium vendors typically offer 35-45% discounts, Mid-tier 40-55%, and Value segment 50-65% off retail pricing.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    <span className="text-gray-600 font-medium">Loading vendor data...</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center"
                >
                  <div className="text-red-600 font-bold text-lg mb-2">Error Loading Vendors</div>
                  <div className="text-red-500 text-sm mb-6">{error}</div>
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg hover:shadow-xl"
                  >
                    Retry
                  </button>
                </motion.div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredVendors.length === 0 && (
                <div className="text-center py-16 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No vendors found</h3>
                  <p className="text-gray-500">
                    {selectedSegment !== "All"
                      ? `No vendors in the ${selectedSegment} segment`
                      : 'No vendor data available'
                    }
                  </p>
                </div>
              )}

              {/* Vendor Grid */}
              {!loading && !error && filteredVendors.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVendors.map((vendor, index) => {
                    const isSelected = selectedVendors.has(vendor.id);

                    return (
                      <motion.div
                        key={vendor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ y: -6, transition: { duration: 0.2 } }}
                        className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border-2 ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{vendor.name}</h3>
                            <div className="flex gap-2 mt-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getSegmentColor(vendor.segment)}`}>
                                {vendor.segment}
                              </span>
                              {vendor.freeShipping && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                  Free Ship
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => toggleVendorSelection(vendor.id)}
                            className={`p-2.5 rounded-xl transition-all ${
                              isSelected
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                          >
                            {isSelected ? <Check className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-4 border border-gray-100">
                            <div className="text-xs font-medium text-gray-500 mb-2">Brands</div>
                            <div className="flex flex-wrap gap-2">
                              {VENDOR_BRANDS[vendor.name]?.slice(0, 4).map((brandCode) => (
                                <span
                                  key={brandCode}
                                  className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full shadow-sm"
                                >
                                  {getBrandName(brandCode)}
                                </span>
                              ))}
                              {VENDOR_BRANDS[vendor.name] && VENDOR_BRANDS[vendor.name].length > 4 && (
                                <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full">
                                  +{VENDOR_BRANDS[vendor.name].length - 4} more
                                </span>
                              )}
                              {!VENDOR_BRANDS[vendor.name] && (
                                <span className="text-sm text-gray-600">{vendor.brands}</span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50/50 rounded-lg p-3">
                              <div className="text-xs font-medium text-gray-500 mb-1">Discount</div>
                              <div className="text-sm font-bold text-blue-600">{vendor.discount}</div>
                            </div>
                            <div className="bg-purple-50/50 rounded-lg p-3">
                              <div className="text-xs font-medium text-gray-500 mb-1">Min Order</div>
                              <div className="text-sm font-bold text-purple-600">{vendor.minOrder}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <div className="text-xs font-medium text-gray-500">Payment</div>
                              <div className="text-sm font-semibold text-gray-700">{vendor.paymentTerms}</div>
                            </div>
                            <div>
                              <div className="text-xs font-medium text-gray-500">Buying Groups</div>
                              <div className="text-sm font-semibold text-gray-700 truncate" title={vendor.buyingGroups}>
                                {vendor.buyingGroups}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                          <button
                            onClick={() => navigate(`/vendor/${vendor.id}`)}
                            className="flex-1 bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                          >
                            View Details
                          </button>
                          <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                            Contact
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </Container>
      </div>
    </div>
  );
};

export default VendorComparisonPage;
