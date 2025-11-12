/**
 * Practice Profile Types
 * Types for the practice profile questionnaire feature
 */

export type PracticeType = 'independent' | 'chain' | 'medical_practice' | 'other';
export type PracticeSpecialty = 'optometry' | 'ophthalmology' | 'both';
export type PatientVolumeRange = '0-100' | '100-500' | '500-1000' | '1000+';
export type FramePriceRange = 'under_100' | '100_200' | '200_300' | '300_plus';

export type PrimaryGoal =
  | 'increase_profit'
  | 'track_inventory'
  | 'compare_vendors'
  | 'reduce_ordering_time'
  | 'better_brand_management'
  | 'improve_margins';

export interface PracticeProfile {
  id: string;
  account_id: string;

  // Practice Information
  practice_type: PracticeType | null;
  practice_specialty: PracticeSpecialty | null;
  years_in_business: number | null;
  patient_volume_range: PatientVolumeRange | null;

  // Brand & Product Preferences
  current_brands: string[]; // Array of brand names
  average_frame_price_range: FramePriceRange | null;

  // Preferences & Goals
  primary_goals: PrimaryGoal[]; // Array of goals

  // Metadata
  completed_at: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PracticeProfileFormData {
  // Step 1: Practice Information
  practice_type: PracticeType | '';
  practice_specialty: PracticeSpecialty | '';
  years_in_business: string; // String for input, converted to number on submit
  patient_volume_range: PatientVolumeRange | '';

  // Step 2: Brands & Products
  current_brands: string[];
  average_frame_price_range: FramePriceRange | '';

  // Step 3: Goals & Preferences
  primary_goals: PrimaryGoal[];
}

export interface QuestionnaireStepProps {
  formData: PracticeProfileFormData;
  onChange: (field: keyof PracticeProfileFormData, value: any) => void;
  errors: Partial<Record<keyof PracticeProfileFormData, string>>;
  onBlur: (field: keyof PracticeProfileFormData) => void;
  touched: Partial<Record<keyof PracticeProfileFormData, boolean>>;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Display labels for select options
export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  independent: 'Independent Practice',
  chain: 'Chain/Corporate',
  medical_practice: 'Medical Practice',
  other: 'Other',
};

export const PRACTICE_SPECIALTY_LABELS: Record<PracticeSpecialty, string> = {
  optometry: 'Optometry',
  ophthalmology: 'Ophthalmology',
  both: 'Both',
};

export const PATIENT_VOLUME_LABELS: Record<PatientVolumeRange, string> = {
  '0-100': '0-100 patients/month',
  '100-500': '100-500 patients/month',
  '500-1000': '500-1,000 patients/month',
  '1000+': '1,000+ patients/month',
};

export const FRAME_PRICE_LABELS: Record<FramePriceRange, string> = {
  under_100: 'Under $100',
  '100_200': '$100 - $200',
  '200_300': '$200 - $300',
  '300_plus': '$300+',
};

export const PRIMARY_GOAL_LABELS: Record<PrimaryGoal, string> = {
  increase_profit: 'Increase profit margins',
  track_inventory: 'Track inventory efficiently',
  compare_vendors: 'Compare vendor pricing',
  reduce_ordering_time: 'Reduce ordering time',
  better_brand_management: 'Better brand management',
  improve_margins: 'Improve profit margins',
};

export const PRIMARY_GOAL_DESCRIPTIONS: Record<PrimaryGoal, string> = {
  increase_profit: 'Find better deals and optimize pricing strategies',
  track_inventory: 'Keep accurate records of stock and orders',
  compare_vendors: 'Easily compare prices across different suppliers',
  reduce_ordering_time: 'Streamline the ordering process',
  better_brand_management: 'Organize and manage brand relationships',
  improve_margins: 'Maximize profitability on each sale',
};
