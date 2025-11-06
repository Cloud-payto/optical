import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Plus, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Brand {
  id: string;
  name: string;
  wholesale_cost?: number;
  msrp?: number;
}

interface MissingBrandsProps {
  vendorId: string;
  vendorName: string;
  userId: string;
  onBrandsAdded: () => void;
}

const MissingBrands: React.FC<MissingBrandsProps> = ({
  vendorId,
  vendorName,
  userId,
  onBrandsAdded
}) => {
  const [missingBrands, setMissingBrands] = useState<Brand[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [addingBrands, setAddingBrands] = useState<Set<string>>(new Set());
  const [addingAll, setAddingAll] = useState(false);

  useEffect(() => {
    fetchMissingBrands();
  }, [vendorId, userId]);

  const fetchMissingBrands = async () => {
    if (!userId || !vendorId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/vendors/missing/${userId}/${vendorId}/brands`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch missing brands:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
          vendorId,
          userId
        });
        setMissingBrands([]);
        return;
      }

      const brands = await response.json();
      console.log(`✅ Fetched ${brands?.length || 0} missing brands for vendor ${vendorId}`);
      setMissingBrands(brands || []);
    } catch (error) {
      console.error('Error fetching missing brands:', error);
      setMissingBrands([]);
      // Don't show toast error - this is a background check
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBrand = async (brandId: string) => {
    setAddingBrands(prev => new Set(prev).add(brandId));

    try {
      const response = await fetch(`/api/vendors/account-brands/${userId}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          brandIds: [brandId]
        })
      });

      if (!response.ok) throw new Error('Failed to add brand');

      const brand = missingBrands.find(b => b.id === brandId);
      toast.success(`Added ${brand?.name || 'brand'} successfully!`);

      // Remove from missing brands
      setMissingBrands(prev => prev.filter(b => b.id !== brandId));
      onBrandsAdded();
    } catch (error) {
      console.error('Error adding brand:', error);
      toast.error('Failed to add brand');
    } finally {
      setAddingBrands(prev => {
        const newSet = new Set(prev);
        newSet.delete(brandId);
        return newSet;
      });
    }
  };

  const handleAddAll = async () => {
    if (missingBrands.length === 0) return;

    setAddingAll(true);
    try {
      const brandIds = missingBrands.map(b => b.id);

      const response = await fetch(`/api/vendors/account-brands/${userId}/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          brandIds
        })
      });

      if (!response.ok) throw new Error('Failed to add brands');

      const result = await response.json();
      toast.success(`Added ${result.addedCount} brand${result.addedCount !== 1 ? 's' : ''} successfully!`);

      setMissingBrands([]);
      onBrandsAdded();
    } catch (error) {
      console.error('Error adding brands:', error);
      toast.error('Failed to add brands');
    } finally {
      setAddingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (missingBrands.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-amber-100 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-amber-600" />
          ) : (
            <ChevronRight className="h-5 w-5 text-amber-600" />
          )}
          <div className="text-left">
            <h4 className="text-sm font-medium text-amber-900">
              Missing Brands from {vendorName}
            </h4>
            <p className="text-xs text-amber-700">
              {missingBrands.length} brand{missingBrands.length !== 1 ? 's' : ''} available to add
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddAll();
          }}
          disabled={addingAll}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addingAll ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-1" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-3 w-3 mr-1" />
              Add All
            </>
          )}
        </button>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-amber-200"
          >
            <div className="p-4 space-y-2">
              {missingBrands.map((brand) => (
                <motion.div
                  key={brand.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-amber-200"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{brand.name}</p>
                    {brand.wholesale_cost && (
                      <p className="text-xs text-gray-500">
                        Wholesale: ${brand.wholesale_cost.toFixed(2)}
                        {brand.msrp && ` | Retail: $${brand.msrp.toFixed(2)}`}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleAddBrand(brand.id)}
                    disabled={addingBrands.has(brand.id)}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 rounded hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingBrands.has(brand.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-amber-700 border-t-transparent mr-1" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </>
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MissingBrands;
