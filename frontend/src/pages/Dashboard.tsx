import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { TechPointsOverview } from '../components/charts/TechPointsOverview';
import { LocationTable } from '../components/features/LocationTable';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import { useDashboardOverview, useLocationTable, useLocations } from '../hooks/useDashboard';

export default function Dashboard() {
  const [trendDays, setTrendDays] = useState(10);
  const [locationCount, setLocationCount] = useState(3);
  const [locationSearch, setLocationSearch] = useState('');

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(undefined, trendDays);
  const { data: locationTable, isLoading: locationTableLoading } = useLocationTable(locationSearch);
  const { data: allLocations } = useLocations();

  // Stats
  const totalLocations = overview?.active_locations ?? allLocations?.length ?? 0;
  const totalAppointments = overview?.total_appointments ?? 0;
  const avgPointsPerDay = overview?.avg_points_per_day
    ? Number(overview.avg_points_per_day).toFixed(1)
    : '0.0';

  // Location trend lines
  const locationColors = [
    { name: 'Location A', color: '#3B82F6', totalPoints: 0 },
    { name: 'Location B', color: '#F472B6', totalPoints: 0 },
    { name: 'Location C', color: '#67E8F9', totalPoints: 0 },
  ];
  if (allLocations && allLocations.length > 0) {
    for (let i = 0; i < Math.min(allLocations.length, locationColors.length); i++) {
      locationColors[i].name = allLocations[i].name;
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1E293B]">Dashboard</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Overview of your organization's performance
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {overviewLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                Active Locations
              </p>
              <p className="text-[28px] font-bold text-[#1E293B] leading-tight mt-1">
                {totalLocations}
              </p>
            </Card>
            <Card>
              <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                Total Appointments
              </p>
              <p className="text-[28px] font-bold text-[#1E293B] leading-tight mt-1">
                {totalAppointments.toLocaleString()}
              </p>
            </Card>
            <Card>
              <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                Avg Points / Day
              </p>
              <p className="text-[28px] font-bold text-[#1E293B] leading-tight mt-1">
                {avgPointsPerDay}
              </p>
            </Card>
          </>
        )}
      </div>

      {/* Tech Points Chart */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="text-[16px] font-bold text-[#1E293B]">Tech Points Overview</h2>
            <p className="text-[13px] text-[#94A3B8] mt-0.5">
              Progress across {locationCount} locations for the past {trendDays} days
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-[120px]">
              <Select
                size="sm"
                options={[
                  { value: 1, label: '1 Location' },
                  { value: 2, label: '2 Locations' },
                  { value: 3, label: '3 Locations' },
                  { value: 5, label: '5 Locations' },
                ]}
                value={locationCount}
                onChange={(e) => setLocationCount(Number(e.target.value))}
              />
            </div>
            <div className="w-[100px]">
              <Select
                size="sm"
                options={[
                  { value: 7, label: '7 days' },
                  { value: 10, label: '10 days' },
                  { value: 14, label: '14 days' },
                  { value: 30, label: '30 days' },
                ]}
                value={trendDays}
                onChange={(e) => setTrendDays(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {overviewLoading ? (
          <div className="h-48 sm:h-64 animate-pulse bg-gray-100 rounded-lg" />
        ) : (
          <TechPointsOverview
            data={overview?.trend_data || []}
            locations={locationColors.slice(0, locationCount)}
          />
        )}
      </Card>

      {/* Locations Table */}
      <div>
        <h2 className="text-[16px] font-bold text-[#1E293B] mb-4">Organization Locations</h2>
        <LocationTable
          locations={locationTable?.locations || []}
          isLoading={locationTableLoading}
          searchValue={locationSearch}
          onSearchChange={setLocationSearch}
        />
      </div>
    </div>
  );
}
