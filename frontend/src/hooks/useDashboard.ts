import { useQuery } from '@tanstack/react-query';
import { dashboardApi, locationsApi } from '../services/api';

export function useDashboardOverview(locations?: string, days?: number) {
  return useQuery({
    queryKey: ['dashboard', 'overview', locations, days],
    queryFn: () => dashboardApi.getOverview(locations, days),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocationTable(search?: string) {
  return useQuery({
    queryKey: ['dashboard', 'location-table', search],
    queryFn: () => dashboardApi.getLocationTable(search),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLocations() {
  return useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}
