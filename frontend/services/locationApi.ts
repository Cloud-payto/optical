/**
 * API service for Practice Locations
 * Handles CRUD operations for multi-location support
 */

import { getApiEndpoint } from '../lib/api-config';
import { supabase } from '../lib/supabase';
import type {
  PracticeLocation,
  LocationFormData,
  LocationListResponse,
  LocationSummary
} from '../types/location.types';

// Generic API request function with auth headers
async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    let session = null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Failed to get session for API request:', error);
      } else {
        session = data.session;
      }
    } catch (sessionError) {
      console.warn('Session retrieval failed, proceeding without auth:', sessionError);
    }

    const response = await fetch(getApiEndpoint(endpoint), {
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token && {
          'Authorization': `Bearer ${session.access_token}`,
        }),
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

export const locationApi = {
  // Get all locations for an account
  getLocations: async (accountId: string, includeInactive = false): Promise<LocationListResponse> => {
    const params = includeInactive ? '?includeInactive=true' : '';
    return apiRequest<LocationListResponse>(`/locations/${accountId}${params}`);
  },

  // Get location summary (count, multi-location status)
  getLocationSummary: async (accountId: string): Promise<LocationSummary> => {
    return apiRequest<LocationSummary>(`/locations/${accountId}/summary`);
  },

  // Get single location
  getLocation: async (accountId: string, locationId: string): Promise<PracticeLocation> => {
    return apiRequest<PracticeLocation>(`/locations/${accountId}/${locationId}`);
  },

  // Create new location
  createLocation: async (accountId: string, data: LocationFormData): Promise<PracticeLocation> => {
    return apiRequest<PracticeLocation>(`/locations/${accountId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update location
  updateLocation: async (
    accountId: string,
    locationId: string,
    data: Partial<LocationFormData>
  ): Promise<PracticeLocation> => {
    return apiRequest<PracticeLocation>(`/locations/${accountId}/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete location (soft delete by default)
  deleteLocation: async (
    accountId: string,
    locationId: string,
    permanent = false
  ): Promise<{ success: boolean; message: string; inventoryAffected: number }> => {
    const params = permanent ? '?permanent=true' : '';
    return apiRequest<{ success: boolean; message: string; inventoryAffected: number }>(
      `/locations/${accountId}/${locationId}${params}`,
      { method: 'DELETE' }
    );
  },

  // Set location as primary
  setPrimaryLocation: async (
    accountId: string,
    locationId: string
  ): Promise<PracticeLocation> => {
    return apiRequest<PracticeLocation>(`/locations/${accountId}/${locationId}/set-primary`, {
      method: 'POST',
    });
  }
};
