/**
 * Returns Page
 * Display generated return reports
 */

import React, { useState } from 'react';
import { Download, FileText, Calendar, Package, Search } from 'lucide-react';

interface ReturnReport {
  id: string;
  reportNumber: string;
  vendorName: string;
  itemCount: number;
  totalQuantity: number;
  generatedDate: string;
  filename: string;
  status: 'pending' | 'submitted' | 'completed';
}

// Mock data - this will be replaced with real data from your database
const mockReports: ReturnReport[] = [
  {
    id: '1',
    reportNumber: 'RR-2025-001',
    vendorName: 'Safilo Group',
    itemCount: 5,
    totalQuantity: 8,
    generatedDate: '2025-01-15',
    filename: 'Return_Report_Safilo_RR-2025-001.pdf',
    status: 'pending'
  },
  {
    id: '2',
    reportNumber: 'RR-2025-002',
    vendorName: 'Luxottica',
    itemCount: 3,
    totalQuantity: 5,
    generatedDate: '2025-01-14',
    filename: 'Return_Report_Luxottica_RR-2025-002.pdf',
    status: 'submitted'
  },
];

export function ReturnsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'submitted' | 'completed'>('all');

  // Filter reports based on search and status
  const filteredReports = mockReports.filter(report => {
    const matchesSearch =
      report.reportNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-[#1F2623] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Return Reports</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">View and manage generated return authorization requests</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search by report number or vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No return reports found</p>
            <p className="text-sm mt-2">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Generate return reports from the Inventory page'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" data-tour="returns-table">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Report Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Date Generated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{report.reportNumber}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">{report.vendorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {report.itemCount} frame{report.itemCount !== 1 ? 's' : ''} ({report.totalQuantity} units)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {new Date(report.generatedDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(report.status)}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => {
                          // TODO: Re-download the PDF from storage or regenerate
                          alert(`Download ${report.filename}\n\nNote: This feature will be connected to your file storage system.`);
                        }}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 font-medium text-sm inline-flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Reports</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredReports.length}</div>
          </div>
          <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Items</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredReports.reduce((sum, r) => sum + r.itemCount, 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Units</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredReports.reduce((sum, r) => sum + r.totalQuantity, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReturnsPage;
