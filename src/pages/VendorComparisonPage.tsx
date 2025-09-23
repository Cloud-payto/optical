import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, ChevronDown, Check, Star, TrendingUp, Loader2 } from 'lucide-react';
import { Container } from '../components/ui/Container';
import { fetchVendors, Vendor } from '../services/api';

interface VendorDisplayData extends Vendor {
  id: number | string;
  minOrder: string;
  paymentTerms: string;
  buyingGroups: string;
}

const segments = ["All", "Premium", "Ultra-Premium", "Mid-Tier", "Value", "Boutique"];

const VendorComparisonPage: React.FC = () => {
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
    <div className="h-full bg-gray-50">
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
                <Package className="h-8 w-8 text-blue-600" />
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Vendor Comparison</h1>
              </div>
              <p className="text-gray-600 text-lg">
                Compare frame vendors and their pricing structures
              </p>
            </div>

            <div className="space-y-6">
              {/* Controls Section */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex flex-wrap gap-4">
                    <div className="relative">
                      <select
                        value={selectedSegment}
                        onChange={(e) => setSelectedSegment(e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        {segments.map(segment => (
                          <option key={segment} value={segment}>
                            {segment === "All" ? "All Segments" : segment}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-50 border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="name">Sort by Name</option>
                        <option value="segment">Sort by Segment</option>
                        <option value="minOrder">Sort by Min Order</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    Showing {filteredVendors.length} vendors
                  </div>
                </div>

                {selectedVendors.size > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-900">
                      {selectedVendors.size} vendor(s) selected for comparison
                    </span>
                  </div>
                )}
              </div>

              {/* Market Insights Banner */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center gap-4">
                  <TrendingUp className="h-10 w-10" />
                  <div>
                    <h3 className="text-xl font-semibold mb-1">Market Insights</h3>
                    <p className="text-blue-100">
                      Premium vendors typically offer 35-45% discounts, Mid-tier 40-55%, and Value segment 50-65% off retail pricing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="text-gray-600">Loading vendor data...</span>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <div className="text-red-600 font-medium mb-2">Error Loading Vendors</div>
                  <div className="text-red-500 text-sm mb-4">{error}</div>
                  <button 
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && filteredVendors.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors found</h3>
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
                  {filteredVendors.map(vendor => {
                    const isSelected = selectedVendors.has(vendor.id);
                    
                    return (
                      <motion.div
                        key={vendor.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        className={`bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 ${
                          isSelected ? 'border-blue-500' : 'border-transparent'
                        }`}
                      >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{vendor.name}</h3>
                          <div className="flex gap-2 mt-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSegmentColor(vendor.segment)}`}>
                              {vendor.segment}
                            </span>
                            {vendor.freeShipping && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Free Ship
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleVendorSelection(vendor.id)}
                          className={`p-2 rounded-full transition-colors ${
                            isSelected 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isSelected ? <Check className="h-5 w-5" /> : <Star className="h-5 w-5" />}
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-sm text-gray-500 mb-1">Brands</div>
                          <div className="text-sm font-medium text-gray-900">{vendor.brands}</div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-gray-500">Discount</div>
                            <div className="text-sm font-semibold text-blue-600">{vendor.discount}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Min Order</div>
                            <div className="text-sm font-semibold">{vendor.minOrder}</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-xs text-gray-500">Payment</div>
                            <div className="text-sm font-medium">{vendor.paymentTerms}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Buying Groups</div>
                            <div className="text-sm font-medium truncate" title={vendor.buyingGroups}>
                              {vendor.buyingGroups}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                          Details
                        </button>
                        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
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