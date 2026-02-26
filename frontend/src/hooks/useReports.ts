import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '../services/api';

export function useTechPointsByLocation(
  locationName: string,
  month: string,
  period?: 'one_week' | 'four_weeks'
) {
  return useQuery({
    queryKey: ['reports', 'tech-points-by-location', locationName, month, period],
    queryFn: () => reportsApi.getTechPointsByLocation(locationName, month, period),
    enabled: !!locationName && !!month,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMonthlyTechPoints(locationName: string, month: string) {
  return useQuery({
    queryKey: ['reports', 'monthly-tech-points', locationName, month],
    queryFn: () => reportsApi.getMonthlyTechPoints(locationName, month),
    enabled: !!locationName && !!month,
    staleTime: 5 * 60 * 1000,
  });
}

export function useScheduledPointsByProvider(locationName: string, month: string) {
  return useQuery({
    queryKey: ['reports', 'scheduled-points-by-provider', locationName, month],
    queryFn: () => reportsApi.getScheduledPointsByProvider(locationName, month),
    enabled: !!locationName && !!month,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePointsPaidTechFTE(month1: string, month2: string) {
  return useQuery({
    queryKey: ['reports', 'points-paid-tech-fte', month1, month2],
    queryFn: () => reportsApi.getPointsPaidTechFTE(month1, month2),
    enabled: !!month1 && !!month2,
    staleTime: 5 * 60 * 1000,
  });
}

export function useWeeklyPointsByLocation(month: string, week: number) {
  return useQuery({
    queryKey: ['reports', 'weekly-points-by-location', month, week],
    queryFn: () => reportsApi.getWeeklyPointsByLocation(month, week),
    enabled: !!month && !!week,
    staleTime: 5 * 60 * 1000,
  });
}
