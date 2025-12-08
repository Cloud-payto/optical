import React, { useState } from 'react';
import { InfoIcon, ChevronDownIcon } from 'lucide-react';
import { formatCurrency, calculateDiscountPercentage } from '../utils/calculations';
import { ProfitData, SavedCalculation } from '../types';
import MoneyFlowDiagram from './MoneyFlowDiagram';

interface ProfitDisplayProps {
  profitData: ProfitData;
  animate: boolean;
  savedCalculations: SavedCalculation[];
  insuranceEnabled: boolean;
}

const ProfitDisplay: React.FC<ProfitDisplayProps> = ({ profitData, animate, savedCalculations, insuranceEnabled }) => {
  const [showReferenceInfo, setShowReferenceInfo] = useState<boolean>(false);
  const { profit, patientPayment, total, yourCost, wholesaleCost, tariffTax, totalCost, profitMargin, discountedAmount, retailPrice, reimbursement } = profitData;
  
  // Determine the profitability level
  const getProfitLevel = (margin: number) => {
    if (margin >= 60) return 'excellent';
    if (margin >= 40) return 'good';
    if (margin >= 20) return 'average';
    return 'poor';
  };
  
  const profitLevel = getProfitLevel(profitMargin);
  
  // Color coding based on profit level
  const colorClasses = {
    excellent: 'text-green-600 bg-green-100',
    good: 'text-blue-600 bg-blue-100',
    average: 'text-yellow-600 bg-yellow-100',
    poor: 'text-red-600 bg-red-100',
  };
  
  const profitColor = colorClasses[profitLevel];
  
  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-5">Profit Analysis</h3>

      <div className="space-y-4">
        {/* Revenue Breakdown - Restructured */}
        <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
            <span className="mr-2">📈</span>
            Revenue Breakdown
          </h4>
          <div className="space-y-2">
            {insuranceEnabled ? (
              // Insurance Mode
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Retail Price (MSRP)</span>
                  <span className="font-medium dark:text-white">{formatCurrency(retailPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">- Insurance Coverage</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(profitData.insuranceCoverage)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-300">- 20% Discount on Difference</span>
                    <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="Insurance contracts require a 20% discount on the portion not covered by insurance" />
                  </div>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(discountedAmount)}
                  </span>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded p-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      = Patient Payment
                    </span>
                    <span className="font-semibold text-green-700 dark:text-green-300">
                      {formatCurrency(patientPayment)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm mt-3">
                  <div className="flex items-center">
                    <span className="text-gray-600 dark:text-gray-300">Insurance Reimbursement</span>
                    <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="Fixed amount paid by insurance providers (typically $57)" />
                  </div>
                  <span className="font-medium dark:text-white">{formatCurrency(reimbursement)}</span>
                </div>
              </>
            ) : (
              // Cash-Pay Mode
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="text-gray-600 dark:text-gray-300">Customer Payment (Full Retail)</span>
                  <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="Customer pays full retail price" />
                </div>
                <span className="font-medium dark:text-white">{formatCurrency(patientPayment)}</span>
              </div>
            )}
            <div className="h-px bg-gray-200 dark:bg-gray-600 my-3"></div>
            <div className="flex justify-between items-center font-semibold text-gray-900 dark:text-white">
              <span>Total Office Revenue</span>
              <span className="text-lg">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown & Profit - Completely Restructured */}
        <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center">
            <span className="mr-2">💼</span>
            Cost Breakdown & Profit
          </h4>

          {/* Office Revenue Collected Subsection */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
            <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
              Office Revenue Collected:
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-700 dark:text-gray-300">Patient Payment</span>
                <span className="font-medium dark:text-white">{formatCurrency(patientPayment)}</span>
              </div>
              {insuranceEnabled && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 dark:text-gray-300">Insurance Reimbursement</span>
                  <span className="font-medium dark:text-white">{formatCurrency(reimbursement)}</span>
                </div>
              )}
              <div className="h-px bg-blue-200 dark:bg-blue-700 my-1"></div>
              <div className="flex justify-between items-center font-semibold">
                <span className="text-blue-900 dark:text-blue-200">Total Revenue</span>
                <span className="text-blue-900 dark:text-blue-200">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Office Costs Paid Subsection */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 mb-3">
            <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
              Office Costs Paid:
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="text-gray-700 dark:text-gray-300">Your Actual Cost</span>
                  <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="The real cost you pay for the frame" />
                </div>
                <span className="font-medium dark:text-white">{formatCurrency(yourCost)}</span>
              </div>
              {tariffTax > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center">
                    <span className="text-gray-700 dark:text-gray-300">Tariff Tax</span>
                    <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="Additional tariff tax applied" />
                  </div>
                  <span className="font-medium dark:text-white">{formatCurrency(tariffTax)}</span>
                </div>
              )}
              <div className="h-px bg-red-200 dark:bg-red-700 my-1"></div>
              <div className="flex justify-between items-center font-semibold">
                <span className="text-red-900 dark:text-red-200">Total Costs</span>
                <span className="text-red-900 dark:text-red-200">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-3 border-2 border-green-500 dark:border-green-600">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Net Profit</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatCurrency(total)} - {formatCurrency(totalCost)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(profit)}
                </div>
                <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {profitMargin}% margin
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reference Information - Collapsible */}
        <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm overflow-hidden">
          <button
            onClick={() => setShowReferenceInfo(!showReferenceInfo)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center">
              <span className="mr-2">📋</span>
              Reference Information (Vendor Details)
            </h4>
            <ChevronDownIcon
              className={`h-4 w-4 text-gray-400 transition-transform ${showReferenceInfo ? 'rotate-180' : ''}`}
            />
          </button>

          {showReferenceInfo && (
            <div className="px-4 pb-3 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="text-gray-600 dark:text-gray-300">Wholesale Price (Frame Book)</span>
                  <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="The cost reported to insurance" />
                </div>
                <span className="font-medium dark:text-white">{formatCurrency(wholesaleCost)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="text-gray-600 dark:text-gray-300">Your Discount from Wholesale</span>
                  <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="How much you save compared to wholesale" />
                </div>
                <span className="font-medium text-green-600 dark:text-green-400">
                  {calculateDiscountPercentage(yourCost, wholesaleCost)}%
                </span>
              </div>
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-gray-600 dark:text-gray-400">
                ℹ️ This information helps you understand your vendor pricing but doesn't affect your actual profit.
              </div>
            </div>
          )}
        </div>

        {/* Money Flow Diagram - Moved to bottom for better visual hierarchy */}
        <MoneyFlowDiagram
          insuranceEnabled={insuranceEnabled}
          retailPrice={retailPrice}
          insuranceCoverage={profitData.insuranceCoverage}
          patientPayment={patientPayment}
          insuranceReimbursement={reimbursement}
          totalOfficeRevenue={total}
        />
      </div>
      
      {savedCalculations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Saved Calculations</h4>
          <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-sm p-2 max-h-48 overflow-y-auto">
            {savedCalculations.map((calc) => (
              <div key={calc.id} className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium dark:text-white">{calc.name}</span>
                  <span className="font-medium dark:text-white">{formatCurrency(calc.profit)}</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap justify-between mt-1">
                  <span>Your Cost: {formatCurrency(calc.yourCost)}</span>
                  {calc.tariffTax > 0 && <span>Tariff: {formatCurrency(calc.tariffTax)}</span>}
                  <span>Wholesale: {formatCurrency(calc.wholesaleCost)}</span>
                  <span>Retail: {formatCurrency(calc.retailPrice)}</span>
                  <span>Margin: {calc.margin}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitDisplay;