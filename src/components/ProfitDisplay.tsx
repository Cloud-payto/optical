import React from 'react';
import { InfoIcon } from 'lucide-react';
import { formatCurrency, calculateDiscountPercentage } from '../utils/calculations';
import { ProfitData, SavedCalculation } from '../types';

interface ProfitDisplayProps {
  profitData: ProfitData;
  animate: boolean;
  savedCalculations: SavedCalculation[];
  insuranceEnabled: boolean;
}

const ProfitDisplay: React.FC<ProfitDisplayProps> = ({ profitData, animate, savedCalculations, insuranceEnabled }) => {
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
      <h3 className="text-xl font-semibold text-gray-800 mb-5">Profit Analysis</h3>
      
      <div className={`mb-8 p-4 rounded-lg ${profitColor} transition-all duration-300 ${animate ? 'scale-105' : 'scale-100'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total Profit</span>
          <span className="text-2xl font-bold">{formatCurrency(profit)}</span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-medium">Profit Margin</span>
          <span className="text-lg font-semibold">{profitMargin}%</span>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Revenue Breakdown</h4>
          <div className="space-y-2">
            {insuranceEnabled ? (
              // Insurance-enabled breakdown
              <>
                {patientPayment > 0 && (
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm">Retail Price</span>
                      </div>
                      <span className="font-medium">{formatCurrency(retailPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm">Insurance Coverage</span>
                      </div>
                      <span className="font-medium text-green-600">-{formatCurrency(profitData.insuranceCoverage)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <span className="text-sm">20% Discount on Difference</span>
                        <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="Insurance contracts require a 20% discount on the portion not covered by insurance" />
                      </div>
                      <span className="font-medium text-green-600">-{formatCurrency(discountedAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-1 rounded mt-1">
                      <span className="text-sm font-medium">Patient Payment</span>
                      <span className="font-medium">{formatCurrency(patientPayment)}</span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mt-2">
                  <div className="flex items-center">
                    <span className="text-sm">Insurance Reimbursement</span>
                    <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="Fixed amount paid by insurance providers (typically $57)" />
                  </div>
                  <span className="font-medium">{formatCurrency(reimbursement)}</span>
                </div>
              </>
            ) : (
              // Non-insurance (cash-pay) breakdown - much simpler
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm">Customer Payment (Full Retail Price)</span>
                  <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="Customer pays full retail price (2x wholesale cost)" />
                </div>
                <span className="font-medium">{formatCurrency(patientPayment)}</span>
              </div>
            )}
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between items-center font-semibold">
              <span>Total Revenue</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Cost Breakdown & Profit</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm">Your Actual Cost</span>
                <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="The real cost you pay for the frame" />
              </div>
              <span className="font-medium">{formatCurrency(yourCost)}</span>
            </div>
            {tariffTax > 0 && (
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-sm">Tariff Tax</span>
                  <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="Additional tariff tax applied to the frame" />
                </div>
                <span className="font-medium text-red-600">{formatCurrency(tariffTax)}</span>
              </div>
            )}
            {tariffTax > 0 && (
              <div className="flex justify-between items-center bg-gray-50 p-1 rounded">
                <div className="flex items-center">
                  <span className="text-sm font-medium">Total Cost with Tariff</span>
                </div>
                <span className="font-medium">{formatCurrency(totalCost)}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm">Wholesale Price</span>
                <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="The cost reported to insurance (Frame Book Price)" />
              </div>
              <span className="font-medium">{formatCurrency(wholesaleCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm">Discount Percentage from Wholesale Price</span>
                <InfoIcon className="h-3 w-3 text-gray-400 ml-1" aria-label="How much you save compared to the wholesale price" />
              </div>
              <span className="font-medium text-green-600">{calculateDiscountPercentage(yourCost, wholesaleCost)}%</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between items-center font-semibold">
              <span>Net Profit</span>
              <span>{formatCurrency(profit)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {savedCalculations.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Saved Calculations</h4>
          <div className="bg-white rounded-lg shadow-sm p-2 max-h-48 overflow-y-auto">
            {savedCalculations.map((calc) => (
              <div key={calc.id} className="p-2 hover:bg-gray-50 rounded transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{calc.name}</span>
                  <span className="font-medium">{formatCurrency(calc.profit)}</span>
                </div>
                <div className="text-xs text-gray-500 flex flex-wrap justify-between mt-1">
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