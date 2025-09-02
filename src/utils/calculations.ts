import { ProfitData } from '../types';

/**
 * Calculate profit data based on input values
 */
export const calculateProfit = (
  yourCost: number,
  wholesaleCost: number,
  tariffTax: number,
  retailPrice: number,
  insuranceCoverage: number,
  insuranceReimbursement: number
): ProfitData => {
  // Ensure all values are valid numbers
  yourCost = Number(yourCost) || 0;
  wholesaleCost = Number(wholesaleCost) || 0;
  tariffTax = Number(tariffTax) || 0;
  retailPrice = Number(retailPrice) || 0;
  insuranceCoverage = Number(insuranceCoverage) || 0;
  insuranceReimbursement = Number(insuranceReimbursement) || 0;
  
  // Calculate the difference between retail price and insurance coverage
  const priceDifference = Math.max(0, retailPrice - insuranceCoverage);
  
  // Apply 20% discount to the difference due to insurance contract
  // Using precise math to avoid rounding errors
  const discountPercentage = 0.2; // 20%
  const discountedAmount = parseFloat((priceDifference * discountPercentage).toFixed(2));
  
  // Calculate patient payment (what the patient pays after insurance and discount)
  const patientPayment = parseFloat((priceDifference - discountedAmount).toFixed(2));
  
  // Note: The insurance does not pay the full coverage amount to the practice
  // The practice only gets the reimbursement amount (typically $57) plus patient payment
  const total = patientPayment + insuranceReimbursement;
  
  // Calculate profit based on YOUR actual cost plus any tariff tax, not the wholesale cost reported to insurance
  const totalCost = yourCost + tariffTax;
  const profit = total - totalCost;
  
  // Calculate profit margin percentage based on YOUR actual cost plus tariff tax
  const profitMargin = totalCost > 0 
    ? Math.round((profit / totalCost) * 100) 
    : 0;
  
  return {
    yourCost,
    wholesaleCost,
    tariffTax,
    totalCost,
    retailPrice,
    patientPayment,
    insurancePayment: 0, // The practice doesn't get the coverage amount directly
    insuranceCoverage, // Adding the coverage amount for display purposes
    reimbursement: insuranceReimbursement,
    total,
    profit,
    profitMargin,
    discountedAmount
  };
};

/**
 * Calculate retail price based on wholesale cost, tariff tax, and insurance multiplier
 */
export const calculateRetailPrice = (wholesaleCost: number, tariffTax: number, multiplier: number): number => {
  // For retail price calculation, we apply the multiplier to the wholesale cost
  // The tariff tax is primarily used in the profit calculation, but we account for it here
  // by slightly increasing the retail price to help maintain margins
  const baseRetailPrice = wholesaleCost * multiplier;
  // If there's a tariff tax, we add a percentage of it to the retail price to help offset the cost
  const tariffAdjustment = tariffTax > 0 ? (tariffTax * 1.2) : 0; // Add 20% markup on the tariff
  
  return Math.round((baseRetailPrice + tariffAdjustment) * 100) / 100;
};

/**
 * Calculate discount percentage from wholesale cost
 */
export const calculateDiscountPercentage = (yourCost: number, wholesaleCost: number): number => {
  if (wholesaleCost <= 0 || yourCost >= wholesaleCost) return 0;
  return Math.round(((wholesaleCost - yourCost) / wholesaleCost) * 100);
};

/**
 * Format a number as currency
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};