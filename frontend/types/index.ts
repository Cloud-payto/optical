/**
 * Profit calculation data interface
 */
export interface ProfitData {
  yourCost: number;
  wholesaleCost: number;
  tariffTax: number;
  totalCost: number;
  retailPrice: number;
  patientPayment: number;
  insurancePayment: number;
  insuranceCoverage: number;
  reimbursement: number;
  total: number;
  profit: number;
  profitMargin: number;
  discountedAmount: number;
}

/**
 * Saved calculation interface
 */
export interface SavedCalculation {
  id: number;
  name: string;
  brand: string;
  insurance?: string; // Optional insurance provider
  insurancePlan?: string; // Optional insurance plan
  insuranceEnabled?: boolean; // Optional insurance toggle state
  yourCost: number;
  wholesaleCost: number;
  tariffTax: number;
  retailPrice: number;
  insuranceCoverage: number;
  insuranceReimbursement: number;
  profit: number;
  margin: number;
  date: string; // Date when saved
}

/**
 * Frame data for comparison
 */
export interface FrameData {
  frameName: string;
  brand: string;
  companyId?: string;
  companyName?: string;
  insurance?: string; // Optional insurance provider
  insuranceEnabled?: boolean; // Optional insurance toggle state
  yourCost: number;
  wholesaleCost: number;
  tariffTax: number;
  retailPrice: number;
  insuranceMultiplier: number;
  useManualRetailPrice: boolean;
  insuranceCoverage: number;
  insuranceReimbursement: number;
  profitData: ProfitData | null;
}

/**
 * Saved comparison interface
 */
export interface SavedComparison {
  id: number;
  name: string;
  date: string;
  frame1: {
    frameName: string;
    brand: string;
    insurance?: string; // Optional insurance provider
    insuranceEnabled?: boolean; // Optional insurance toggle state
    yourCost: number;
    wholesaleCost: number;
    tariffTax: number;
    retailPrice: number;
    insuranceCoverage: number;
    insuranceReimbursement: number;
    profit: number;
    margin: number;
  };
  frame2: {
    frameName: string;
    brand: string;
    insurance?: string; // Optional insurance provider
    insuranceEnabled?: boolean; // Optional insurance toggle state
    yourCost: number;
    wholesaleCost: number;
    tariffTax: number;
    retailPrice: number;
    insuranceCoverage: number;
    insuranceReimbursement: number;
    profit: number;
    margin: number;
  };
}

/**
 * User authentication interface
 */
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Authentication context interface
 */
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

/**
 * Brand interface for Brands & Costs page
 */
export interface Brand {
  id: string;
  name: string;
  wholesaleCost?: number;
  yourCost?: number;
  tariffTax?: number;
  retailPrice?: number;
  notes?: string;
}

/**
 * Company interface for Brands & Costs page
 */
export interface Company {
  id: string;
  name: string;
  accountNumber?: string | null;
  brands: Brand[];
  contactInfo?: {
    companyEmail?: string;
    companyPhone?: string;
    supportEmail?: string;
    supportPhone?: string;
    website?: string;
    repName?: string;
    repEmail?: string;
    repPhone?: string;
  };
}