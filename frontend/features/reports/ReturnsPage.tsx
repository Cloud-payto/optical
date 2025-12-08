/**
 * Returns Page
 * Display generated return reports
 */

import React, { useState } from 'react';
import { Download, FileText, Calendar, Package, Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { downloadReturnReport } from '../../lib/storage';
import { downloadPDF } from '../inventory/utils/generateReturnReportPDF';
import { fetchReturnReports, type ReturnReport } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export function ReturnsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'generated' | 'sent' | 'cancelled'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch real return reports from API
  const { data: reports = [], isLoading, error } = useQuery({
    queryKey: ['return-reports', user?.id, statusFilter],
    queryFn: () => fetchReturnReports(user?.id, statusFilter),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds to catch new reports
  });

  // Filter reports based on search query only (status filter is handled by API)
  const filteredReports = reports.filter(report => {
    if (!searchQuery) return true;

    const matchesSearch =
      report.report_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.vendor_name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
      generated: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return styles[status as keyof typeof styles] || styles.generated;
  };

  /**
   * Handle PDF download from Supabase Storage
   */
  const handleDownload = async (report: ReturnReport) => {
    // Check if we have a storage path
    if (!report.pdf_path) {
      toast.error('PDF file path not found. Please regenerate this report.');
      return;
    }

    setDownloadingId(report.id);

    try {
      // Download the PDF blob from Supabase Storage
      const blob = await downloadReturnReport(report.pdf_path);

      if (!blob) {
        // Error toast already shown by downloadReturnReport
        return;
      }

      // Trigger browser download
      downloadPDF(blob, report.filename);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report. Please try again.');
    } finally {
      setDownloadingId(null);
    }
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
            <option value="draft">Draft</option>
            <option value="generated">Generated</option>
            <option value="sent">Sent</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Loader2 className="h-16 w-16 mx-auto mb-4 opacity-50 animate-spin" />
            <p className="text-lg font-medium">Loading return reports...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 dark:text-red-400">
            <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Failed to load return reports</p>
            <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        ) : filteredReports.length === 0 ? (
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
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{report.report_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">{report.vendor_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {report.item_count} frame{report.item_count !== 1 ? 's' : ''} ({report.total_quantity} units)
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {new Date(report.generated_date).toLocaleDateString('en-US', {
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
                        onClick={() => handleDownload(report)}
                        disabled={downloadingId === report.id}
                        className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 font-medium text-sm inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                      >
                        {downloadingId === report.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Download
                          </>
                        )}
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
              {filteredReports.reduce((sum, r) => sum + r.item_count, 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Units</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredReports.reduce((sum, r) => sum + r.total_quantity, 0)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReturnsPage;
