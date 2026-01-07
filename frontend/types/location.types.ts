/**
 * TypeScript interfaces for Practice Locations
 * Supports multi-location inventory tracking
 */

export interface PracticeLocation {
  id: string;
  account_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationFormData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  phone?: string;
  is_primary?: boolean;
}

export interface LocationListResponse {
  locations: PracticeLocation[];
  count: number;
  isMultiLocation: boolean;
}

export interface LocationSummary {
  totalLocations: number;
  isMultiLocation: boolean;
  hasPrimaryLocation: boolean;
  primaryLocationId: string | null;
  defaultLocationId: string | null;
}
