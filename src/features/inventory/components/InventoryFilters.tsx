import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { InventoryFilters as FilterState } from '../types/inventory.types';

interface InventoryFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  vendors: string[];
  brands: string[];
  colors: string[];
  returnReportCount?: number;
  onOpenReturnReport?: () => void;
}

export function InventoryFilters({
  filters,
  onFilterChange,
  vendors,
  brands,
  colors,
  returnReportCount = 0,
  onOpenReturnReport
}: InventoryFiltersProps) {
  const handleVendorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, vendor: e.target.value || undefined });
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, brand: e.target.value || undefined });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, color: e.target.value || undefined });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value as FilterState['sortBy'] || undefined
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Vendor Filter */}
          <div className="relative">
            <select
              value={filters.vendor || ''}
              onChange={handleVendorChange}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-[160px]"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <select
              data-demo="brand-filter"
              value={filters.brand || ''}
              onChange={handleBrandChange}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-[160px]"
            >
              <option value="">All Brands</option>
              {brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Color Filter */}
          <div className="relative">
            <select
              value={filters.color || ''}
              onChange={handleColorChange}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-[160px]"
            >
              <option value="">All Colors</option>
              {colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              data-demo="sort-dropdown"
              value={filters.sortBy || 'newest'}
              onChange={handleSortChange}
              className="appearance-none bg-white border border-gray-300 rounded-xl px-4 py-2.5 pr-10 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all min-w-[180px]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="return_window">Return Window (Closing Soon)</option>
              <option value="brand">Brand (A-Z)</option>
              <option value="stock">Stock (High-Low)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Right: Return Report Button */}
        {onOpenReturnReport && (
          <button
            data-demo="return-report-btn"
            onClick={onOpenReturnReport}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm hover:shadow flex items-center gap-2 shrink-0"
          >
            <span>🔄 Return Report</span>
            {returnReportCount > 0 && (
              <span className="bg-purple-800 px-2 py-0.5 rounded-full text-xs">
                {returnReportCount}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
