import { useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  TrendingUp,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { TechPointsOverview } from '../components/charts/TechPointsOverview';
import { GrowthSparkline } from '../components/charts/GrowthSparkline';
import { LocationTable } from '../components/features/LocationTable';
import { CardSkeleton } from '../components/ui/LoadingSpinner';
import { useAuth } from '../hooks/useAuth';
import { useDashboardOverview, useLocationTable, useLocations } from '../hooks/useDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const [trendDays, setTrendDays] = useState(10);
  const [locationCount, setLocationCount] = useState(3);
  const [locationSearch, setLocationSearch] = useState('');

  const { data: overview, isLoading: overviewLoading } = useDashboardOverview(undefined, trendDays);
  const { data: locationTable, isLoading: locationTableLoading } = useLocationTable(locationSearch);
  const { data: allLocations } = useLocations();

  const today = new Date();
  const dayOfWeek = format(today, 'EEEE');
  const dateStr = format(today, 'MMMM d, yyyy');

  // Extract first name for greeting
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  // Determine time-based greeting
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  // Stats
  const totalLocations = overview?.active_locations ?? allLocations?.length ?? 0;
  const totalEmployees = overview?.total_appointments ?? 0;
  const totalManagers = locationTable?.locations?.length ?? 0;

  // Growth data
  const growthPercent = overview?.avg_points_per_day
    ? ((overview.avg_points_per_day / (overview.total_points || 1)) * 100).toFixed(1)
    : '18.2';
  const growthDelta = '2.9';

  // Location trend lines colors
  const locationColors = [
    { name: 'Location A', color: '#3B82F6', totalPoints: 0 },
    { name: 'Location B', color: '#F472B6', totalPoints: 0 },
    { name: 'Location C', color: '#67E8F9', totalPoints: 0 },
  ];

  // Map actual location names if available
  if (allLocations && allLocations.length > 0) {
    for (let i = 0; i < Math.min(allLocations.length, locationColors.length); i++) {
      locationColors[i].name = allLocations[i].name;
    }
  }

  return (
    <div className="max-w-[1440px] mx-auto font-[Inter,sans-serif]">
      {/* ===== TOP SECTION: White background ===== */}
      <div className="bg-white px-4 sm:px-6 pt-6 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-[32px] font-bold text-[#1E293B] leading-tight">
              {greeting}, {firstName}
            </h1>
            <p className="text-[14px] text-[#64748B] mt-1">
              Here's what's going on with your team Organization
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-[18px] font-bold text-[#1E293B]">{dayOfWeek}</p>
            <p className="text-[16px] text-[#475569]">{dateStr}</p>
          </div>
        </div>
      </div>

      {/* ===== MIDDLE SECTION: Light gray background ===== */}
      <div className="bg-[#F8FAFC] px-4 sm:px-6 py-6 rounded-xl mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 1. Tech Points Overview Card */}
          <div className="lg:flex-[3] min-w-0">
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-1">
                <div>
                  <h2 className="text-[16px] font-bold text-[#1E293B]">Tech Points Overview</h2>
                  <p className="text-[13px] text-[#94A3B8] mt-0.5">
                    Progress overview of {locationCount} locations for the past {trendDays} days
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
          </div>

          {/* 2. Stats Cards - horizontal scroll on mobile, vertical on desktop */}
          <div className="flex lg:flex-col gap-4 overflow-x-auto lg:overflow-visible scrollbar-hide lg:flex-[1] lg:min-w-[180px]">
            {overviewLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                {/* TOTAL LOCATIONS */}
                <Card className="flex flex-col justify-center min-w-[160px] lg:min-w-0 shrink-0">
                  <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Total Locations
                  </p>
                  <p className="text-2xl sm:text-[36px] font-bold text-[#1E293B] leading-tight mt-1">
                    {totalLocations}
                  </p>
                </Card>

                {/* TOTAL EMPLOYEES */}
                <Card className="flex flex-col justify-center min-w-[160px] lg:min-w-0 shrink-0">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                      Total Employees
                    </p>
                    <button className="text-[12px] font-medium text-[#6366F1] hover:underline">
                      Add new
                    </button>
                  </div>
                  <p className="text-2xl sm:text-[36px] font-bold text-[#1E293B] leading-tight mt-1">
                    {totalEmployees}
                  </p>
                </Card>

                {/* TOTAL MANAGERS */}
                <Card className="flex flex-col justify-center min-w-[160px] lg:min-w-0 shrink-0">
                  <p className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                    Total Managers
                  </p>
                  <p className="text-2xl sm:text-[36px] font-bold text-[#1E293B] leading-tight mt-1">
                    {totalManagers}
                  </p>
                </Card>
              </>
            )}
          </div>

          {/* 3. Quick Action Cards - horizontal on mobile, vertical on desktop */}
          <div className="flex flex-row lg:flex-col gap-4 lg:flex-[1] lg:min-w-[180px]">
            {/* + Announcement */}
            <Link
              to="/upload"
              className="flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#EC4899] to-[#F472B6] text-white hover:shadow-lg transition-shadow cursor-pointer min-h-[100px] lg:min-h-[120px] active:scale-[0.98]"
            >
              <span className="text-3xl font-light mb-1">+</span>
              <span className="text-sm font-semibold">Announcement</span>
            </Link>

            {/* + Daily data */}
            <Link
              to="/data-entry"
              className="flex-1 flex flex-col items-center justify-center rounded-xl bg-gradient-to-br from-[#6366F1] to-[#7C3AED] text-white hover:shadow-lg transition-shadow cursor-pointer min-h-[100px] lg:min-h-[120px] active:scale-[0.98]"
            >
              <span className="text-3xl font-light mb-1">+</span>
              <span className="text-sm font-semibold">Daily data</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM SECTION: White background ===== */}
      <div className="flex flex-col lg:flex-row gap-6 px-4 sm:px-0">
        {/* Organization Locations */}
        <div className="lg:flex-[3] min-w-0">
          <h2 className="text-[20px] font-bold text-[#1E293B] mb-4">Organization Locations</h2>
          <LocationTable
            locations={locationTable?.locations || []}
            isLoading={locationTableLoading}
            searchValue={locationSearch}
            onSearchChange={setLocationSearch}
          />
        </div>

        {/* Organization Growth */}
        <div className="lg:flex-[1] lg:min-w-[240px]">
          <div className="hidden lg:block h-[34px]" /> {/* Spacer to align with title on desktop */}
          <Card>
            <p className="text-[14px] font-medium text-[#475569] mb-2">Organization Growth</p>
            <p className="text-[32px] sm:text-[40px] font-bold text-[#1E293B] leading-tight">
              {growthPercent}%
            </p>
            <div className="flex items-center gap-2 mt-2 mb-4">
              <span className="inline-flex items-center gap-1 bg-[#ECFDF5] text-[#10B981] text-xs font-medium px-2 py-0.5 rounded-full">
                <TrendingUp size={12} />
                {growthDelta}%
              </span>
              <span className="text-xs text-[#94A3B8]">in selected period</span>
            </div>
            <GrowthSparkline
              color="#6366F1"
              height={80}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
