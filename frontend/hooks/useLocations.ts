/**
 * React Query hooks for Practice Locations
 * Handles fetching, creating, updating, and deleting locations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationApi } from '../services/locationApi';
import type { LocationFormData } from '../types/location.types';
import toast from 'react-hot-toast';

// Query keys
export const locationKeys = {
  all: ['locations'] as const,
  list: (accountId: string) => [...locationKeys.all, 'list', accountId] as const,
  summary: (accountId: string) => [...locationKeys.all, 'summary', accountId] as const,
  detail: (accountId: string, locationId: string) =>
    [...locationKeys.all, 'detail', accountId, locationId] as const,
};

// Hook to get all locations
export function useLocations(accountId: string | undefined, includeInactive = false) {
  return useQuery({
    queryKey: locationKeys.list(accountId || ''),
    queryFn: () => locationApi.getLocations(accountId!, includeInactive),
    enabled: !!accountId,
  });
}

// Hook to get location summary (count, isMultiLocation)
export function useLocationSummary(accountId: string | undefined) {
  return useQuery({
    queryKey: locationKeys.summary(accountId || ''),
    queryFn: () => locationApi.getLocationSummary(accountId!),
    enabled: !!accountId,
  });
}

// Hook to create location
export function useCreateLocation(accountId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LocationFormData) => locationApi.createLocation(accountId!, data),
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(accountId!) });
      queryClient.invalidateQueries({ queryKey: locationKeys.summary(accountId!) });
      toast.success(`Location "${newLocation.name}" created`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create location');
    },
  });
}

// Hook to update location
export function useUpdateLocation(accountId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ locationId, data }: { locationId: string; data: Partial<LocationFormData> }) =>
      locationApi.updateLocation(accountId!, locationId, data),
    onSuccess: (updatedLocation) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(accountId!) });
      queryClient.invalidateQueries({ queryKey: locationKeys.summary(accountId!) });
      toast.success(`Location "${updatedLocation.name}" updated`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update location');
    },
  });
}

// Hook to delete location
export function useDeleteLocation(accountId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ locationId, permanent = false }: { locationId: string; permanent?: boolean }) =>
      locationApi.deleteLocation(accountId!, locationId, permanent),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(accountId!) });
      queryClient.invalidateQueries({ queryKey: locationKeys.summary(accountId!) });
      toast.success(result.message);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete location');
    },
  });
}

// Hook to set primary location
export function useSetPrimaryLocation(accountId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (locationId: string) => locationApi.setPrimaryLocation(accountId!, locationId),
    onSuccess: (location) => {
      queryClient.invalidateQueries({ queryKey: locationKeys.list(accountId!) });
      queryClient.invalidateQueries({ queryKey: locationKeys.summary(accountId!) });
      toast.success(`"${location.name}" is now the primary location`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to set primary location');
    },
  });
}
