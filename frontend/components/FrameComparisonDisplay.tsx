import React from 'react';
import { TrendingUpIcon, Check } from 'lucide-react';
import { formatCurrency, calculateDiscountPercentage } from '../utils/calculations';
import { ProfitData } from '../types';

interface FrameComparisonDisplayProps {
  frame1: {
    name: string;
    data: ProfitData;
  };
  frame2: {
    name: string;
    data: ProfitData;
  };
}

const FrameComparisonDisplay: React.FC<FrameComparisonDisplayProps> = ({ frame1, frame2 }) => {
  // Determine which frame is more profitable
  const frame1Profit = frame1.data.profit;
  const frame2Profit = frame2.data.profit;
  const isFrame1MoreProfitable = frame1Profit > frame2Profit;
  const isFrame2MoreProfitable = frame2Profit > frame1Profit;
  const profitDifference = Math.abs(frame1Profit - frame2Profit);
  
  // Determine profit margin difference
  const frame1Margin = frame1.data.profitMargin;
  const frame2Margin = frame2.data.profitMargin;
  const marginDifference = Math.abs(frame1Margin - frame2Margin);
  
  return (
    <div className="bg-white dark:bg-[#1F2623] rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-center mb-6 dark:text-gray-100">Profit Comparison</h3>

      {/* Header with winner indicator */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-[#181F1C]/50 rounded-lg">
        {isFrame1MoreProfitable && (
          <div className="flex items-center justify-center text-green-600 dark:text-green-400">
            <Check className="h-5 w-5 mr-2" />
            <span className="font-bold">{frame1.name} is more profitable by {formatCurrency(profitDifference)}</span>
          </div>
        )}

        {isFrame2MoreProfitable && (
          <div className="flex items-center justify-center text-green-600 dark:text-green-400">
            <Check className="h-5 w-5 mr-2" />
            <span className="font-bold">{frame2.name} is more profitable by {formatCurrency(profitDifference)}</span>
          </div>
        )}

        {!isFrame1MoreProfitable && !isFrame2MoreProfitable && (
          <div className="text-center text-gray-600 dark:text-gray-300 font-medium">
            Both frames have equal profitability
          </div>
        )}
      </div>
      
      {/* Side by side comparison */}
      <div className="grid grid-cols-3 gap-4">
        {/* Headers */}
        <div className="col-span-1"></div>
        <div className="col-span-1 text-center font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-t-lg">
          {frame1.name}
        </div>
        <div className="col-span-1 text-center font-semibold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 p-2 rounded-t-lg">
          {frame2.name}
        </div>

        {/* Your Actual Cost */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Your Actual Cost
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 dark:bg-blue-900/20 dark:text-gray-100">
          {formatCurrency(frame1.data.yourCost)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 dark:bg-green-900/20 dark:text-gray-100">
          {formatCurrency(frame2.data.yourCost)}
        </div>

        {/* Wholesale Price */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Wholesale Price
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 dark:bg-blue-900/20 dark:text-gray-100">
          {formatCurrency(frame1.data.wholesaleCost)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 dark:bg-green-900/20 dark:text-gray-100">
          {formatCurrency(frame2.data.wholesaleCost)}
        </div>

        {/* Discount Percentage */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Discount from Wholesale
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 dark:bg-blue-900/20 font-medium dark:text-gray-100">
          {calculateDiscountPercentage(frame1.data.yourCost, frame1.data.wholesaleCost)}%
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 dark:bg-green-900/20 font-medium dark:text-gray-100">
          {calculateDiscountPercentage(frame2.data.yourCost, frame2.data.wholesaleCost)}%
        </div>

        {/* Retail Price */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Retail Price
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 dark:bg-blue-900/20 dark:text-gray-100">
          {formatCurrency(frame1.data.retailPrice)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 dark:bg-green-900/20 dark:text-gray-100">
          {formatCurrency(frame2.data.retailPrice)}
        </div>

        {/* Patient Payment */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Patient Payment
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 dark:bg-blue-900/20 dark:text-gray-100">
          {formatCurrency(frame1.data.patientPayment)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 dark:bg-green-900/20 dark:text-gray-100">
          {formatCurrency(frame2.data.patientPayment)}
        </div>

        {/* Insurance Reimbursement */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Insurance Reimbursement
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 dark:bg-blue-900/20 dark:text-gray-100">
          {formatCurrency(frame1.data.reimbursement)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 dark:bg-green-900/20 dark:text-gray-100">
          {formatCurrency(frame2.data.reimbursement)}
        </div>

        {/* Total Revenue */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Total Revenue
        </div>
        <div className="col-span-1 text-center p-2 bg-blue-50 dark:bg-blue-900/20 font-medium dark:text-gray-100">
          {formatCurrency(frame1.data.total)}
        </div>
        <div className="col-span-1 text-center p-2 bg-green-50 dark:bg-green-900/20 font-medium dark:text-gray-100">
          {formatCurrency(frame2.data.total)}
        </div>

        {/* Profit */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Net Profit
        </div>
        <div className={`col-span-1 text-center p-2 dark:text-gray-100 ${isFrame1MoreProfitable ? 'bg-blue-200 dark:bg-blue-700 font-bold' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
          {formatCurrency(frame1.data.profit)}
        </div>
        <div className={`col-span-1 text-center p-2 dark:text-gray-100 ${isFrame2MoreProfitable ? 'bg-green-200 dark:bg-green-700 font-bold' : 'bg-green-50 dark:bg-green-900/20'}`}>
          {formatCurrency(frame2.data.profit)}
        </div>

        {/* Profit Margin */}
        <div className="col-span-1 bg-gray-50 dark:bg-[#181F1C]/50 p-2 font-medium flex items-center dark:text-gray-200">
          Profit Margin
        </div>
        <div className={`col-span-1 text-center p-2 dark:text-gray-100 ${frame1Margin > frame2Margin ? 'bg-blue-200 dark:bg-blue-700 font-bold' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
          {frame1.data.profitMargin}%
        </div>
        <div className={`col-span-1 text-center p-2 dark:text-gray-100 ${frame2Margin > frame1Margin ? 'bg-green-200 dark:bg-green-700 font-bold' : 'bg-green-50 dark:bg-green-900/20'}`}>
          {frame2.data.profitMargin}%
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-[#181F1C]/50 rounded-lg">
        <h4 className="font-semibold mb-2 flex items-center dark:text-gray-100">
          <TrendingUpIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
          Recommendation
        </h4>
        <p className="text-gray-700 dark:text-gray-300">
          {isFrame1MoreProfitable ? (
            <>
              <span className="font-medium">{frame1.name}</span> provides {formatCurrency(profitDifference)} more profit 
              ({marginDifference}% higher margin) than <span className="font-medium">{frame2.name}</span>.
            </>
          ) : isFrame2MoreProfitable ? (
            <>
              <span className="font-medium">{frame2.name}</span> provides {formatCurrency(profitDifference)} more profit 
              ({marginDifference}% higher margin) than <span className="font-medium">{frame1.name}</span>.
            </>
          ) : (
            <>
              Both frames offer identical profitability. Consider other factors like availability, 
              customer preference, or inventory management.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default FrameComparisonDisplay;
