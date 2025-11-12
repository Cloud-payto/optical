import React from 'react';
import { ArrowRightIcon, ArrowDownIcon } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface MoneyFlowDiagramProps {
  insuranceEnabled: boolean;
  retailPrice: number;
  insuranceCoverage: number;
  patientPayment: number;
  insuranceReimbursement: number;
  totalOfficeRevenue: number;
}

/**
 * MoneyFlowDiagram Component
 *
 * Visualizes the flow of money from retail price through insurance/patient
 * to the office revenue. Adapts based on whether insurance is enabled.
 *
 * Features:
 * - Two modes: Insurance-enabled and Cash-pay
 * - Responsive design (mobile, tablet, desktop)
 * - Dark mode support
 * - Clear visual hierarchy with color coding
 */
const MoneyFlowDiagram: React.FC<MoneyFlowDiagramProps> = ({
  insuranceEnabled,
  retailPrice,
  insuranceCoverage,
  patientPayment,
  insuranceReimbursement,
  totalOfficeRevenue,
}) => {
  return (
    <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-4 mb-4">
      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
        <span className="mr-2">💵</span>
        Money Flow
      </h4>

      {insuranceEnabled ? (
        // Insurance Mode Flow
        <div className="space-y-3">
          {/* Retail → Insurance Coverage → Patient Payment */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="w-full md:flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-gray-600 dark:text-gray-400">Retail Price</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(retailPrice)}
              </div>
            </div>

            <ArrowRightIcon className="hidden md:block h-4 w-4 text-gray-400 flex-shrink-0" />
            <ArrowDownIcon className="md:hidden h-4 w-4 text-gray-400 flex-shrink-0" />

            <div className="w-full md:flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center border border-red-200 dark:border-red-800">
              <div className="text-xs text-gray-600 dark:text-gray-400">Insurance Covers</div>
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                -{formatCurrency(insuranceCoverage)}
              </div>
            </div>

            <ArrowRightIcon className="hidden md:block h-4 w-4 text-gray-400 flex-shrink-0" />
            <ArrowDownIcon className="md:hidden h-4 w-4 text-gray-400 flex-shrink-0" />

            <div className="w-full md:flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center border-2 border-green-500 dark:border-green-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">Patient Pays</div>
              <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                {formatCurrency(patientPayment)}
              </div>
            </div>
          </div>

          {/* Insurance Reimbursement Path */}
          <div className="flex justify-center">
            <div className="w-full md:w-1/2 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center border-2 border-purple-500 dark:border-purple-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">Insurance Reimburses</div>
              <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                {formatCurrency(insuranceReimbursement)}
              </div>
            </div>
          </div>

          {/* Both flows converge to Office */}
          <div className="flex justify-center">
            <ArrowDownIcon className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex justify-center">
            <div className="w-full md:w-2/3 bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 rounded-lg p-4 text-center shadow-lg">
              <div className="text-xs text-white/80 uppercase tracking-wide font-medium">Office Receives</div>
              <div className="text-xl font-bold text-white mt-1">
                {formatCurrency(totalOfficeRevenue)}
              </div>
              <div className="text-xs text-white/70 mt-1">
                ({formatCurrency(patientPayment)} + {formatCurrency(insuranceReimbursement)})
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Cash-Pay Mode Flow
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <div className="w-full md:flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center border border-blue-200 dark:border-blue-800">
              <div className="text-xs text-gray-600 dark:text-gray-400">Retail Price</div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatCurrency(retailPrice)}
              </div>
            </div>

            <ArrowRightIcon className="hidden md:block h-4 w-4 text-gray-400 flex-shrink-0" />
            <ArrowDownIcon className="md:hidden h-4 w-4 text-gray-400 flex-shrink-0" />

            <div className="w-full md:flex-1 bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center border-2 border-green-500 dark:border-green-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">Customer Pays</div>
              <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                {formatCurrency(patientPayment)}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowDownIcon className="h-5 w-5 text-gray-400" />
          </div>

          <div className="flex justify-center">
            <div className="w-full md:w-2/3 bg-gradient-to-r from-blue-500 to-green-500 dark:from-blue-600 dark:to-green-600 rounded-lg p-4 text-center shadow-lg">
              <div className="text-xs text-white/80 uppercase tracking-wide font-medium">Office Receives</div>
              <div className="text-xl font-bold text-white mt-1">
                {formatCurrency(totalOfficeRevenue)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyFlowDiagram;
