import React, { useState, useEffect } from 'react';
import { PackageIcon, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchPendingImports, importFromInventory, PendingImport } from '../../services/api';
import toast from 'react-hot-toast';

interface ImportFromInventoryProps {
  onImportComplete: () => void;
}

const ImportFromInventory: React.FC<ImportFromInventoryProps> = ({ onImportComplete }) => {
  const [pendingImports, setPendingImports] = useState<PendingImport | null>(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    loadPendingImports();
  }, []);

  const loadPendingImports = async () => {
    try {
      setLoading(true);
      console.log('🔄 [FRONTEND] Fetching pending imports...');
      const data = await fetchPendingImports();

      console.log('📥 [FRONTEND] Received pending imports:', {
        vendors: data.vendors.length,
        brands: data.brands.length,
        vendorDetails: data.vendors,
        brandDetails: data.brands
      });

      if (data.vendors.length > 0) {
        console.log('🆕 [FRONTEND] NEW VENDORS DETECTED:');
        data.vendors.forEach(v => console.log(`   - ${v.name} (${v.brandCount} brands)`));
      }

      if (data.brands.length > 0) {
        console.log('🆕 [FRONTEND] NEW BRANDS DETECTED:');
        data.brands.forEach(b => console.log(`   - ${b.brand_name} (${b.vendor_name})`));
      }

      if (data.vendors.length === 0 && data.brands.length === 0) {
        console.log('✅ [FRONTEND] No new vendors or brands to import');
      }

      setPendingImports(data);
    } catch (error) {
      console.error('❌ [FRONTEND] Error loading pending imports:', error);
      toast.error('Failed to check for pending imports');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!pendingImports) return;

    try {
      setImporting(true);

      const vendorIds = pendingImports.vendors.map(v => v.id);
      const brandData = pendingImports.brands;

      const result = await importFromInventory(vendorIds, brandData);

      if (result.success) {
        toast.success(
          `Successfully imported ${result.vendorsAdded} vendors and ${result.brandsAdded} brands!`
        );
        setPendingImports({ vendors: [], brands: [] });
        onImportComplete();
      } else {
        toast.error('Failed to import vendors and brands');
      }
    } catch (error) {
      console.error('Error importing from inventory:', error);
      toast.error('An error occurred during import');
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border border-blue-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-gray-600 dark:text-gray-300">Checking for vendors in your inventory...</span>
        </div>
      </div>
    );
  }

  const totalVendors = pendingImports?.vendors.length || 0;
  const totalBrands = pendingImports?.brands.length || 0;

  if (totalVendors === 0 && totalBrands === 0) {
    return null; // Don't show anything if there's nothing to import
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-2 border-blue-300 dark:border-blue-600 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <PackageIcon className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Import Vendors & Brands from Your Inventory
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            We found {totalVendors} vendor{totalVendors !== 1 ? 's' : ''} and {totalBrands} brand{totalBrands !== 1 ? 's' : ''} in your confirmed inventory that aren't in your vendors section yet.
          </p>

          {/* Vendor List */}
          {totalVendors > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vendors to Import:</h4>
              <div className="flex flex-wrap gap-2">
                {pendingImports?.vendors.map(vendor => (
                  <div
                    key={vendor.id}
                    className="bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full border border-blue-200 dark:border-blue-700 text-sm"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">{vendor.name}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">({vendor.brandCount} brand{vendor.brandCount !== 1 ? 's' : ''})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand List */}
          {totalBrands > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Brands to Import:</h4>
              <div className="max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {pendingImports?.brands.map((brand, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-700 px-3 py-1.5 rounded-full border border-indigo-200 dark:border-indigo-700 text-sm"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{brand.brand_name}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">({brand.vendor_name})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-demo="import-vendor-btn"
            data-tour="import-vendor-btn"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Import All to Vendors
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportFromInventory;
