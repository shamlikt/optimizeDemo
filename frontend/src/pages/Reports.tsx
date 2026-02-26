import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Search, MapPin, BarChart3, Calendar, Users, Table2 } from 'lucide-react';
import { LocationSidebar } from '../components/layout/LocationSidebar';
import { TechPointsBarChart } from '../components/charts/TechPointsBarChart';
import { MonthlyTechPointsChart } from '../components/charts/MonthlyTechPointsChart';
import { ProviderPointsChart } from '../components/charts/ProviderPointsChart';
import { FTEComparisonChart } from '../components/charts/FTEComparisonChart';
import { WeeklyPointsGrid } from '../components/charts/WeeklyPointsGrid';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Select } from '../components/ui/Select';
import { Input } from '../components/ui/Input';
import { useLocations } from '../hooks/useDashboard';
import {
  useTechPointsByLocation,
  useMonthlyTechPoints,
  useScheduledPointsByProvider,
  usePointsPaidTechFTE,
  useWeeklyPointsByLocation,
} from '../hooks/useReports';
import type { ReportType } from '../types';

const REPORT_OPTIONS = [
  { value: 'tech_points_by_location', label: 'Tech Points by Location' },
  { value: 'monthly_tech_points', label: 'Tech Points by Monthly Tech Point by Location' },
  { value: 'scheduled_points_by_provider', label: 'Scheduled Points by Provider (5.1 - 5.5)' },
  { value: 'points_paid_tech_fte', label: 'Points Paid Tech FTE' },
  { value: 'weekly_points_by_day', label: 'Weekly Points by day by Location' },
];

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, i, 1);
  return { value: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy') };
});

const TIME_RANGE_OPTIONS = [
  { value: 'one_week', label: 'One week' },
  { value: 'four_weeks', label: 'Four weeks' },
];

const WEEK_OPTIONS = [
  { value: 1, label: 'Week 1' },
  { value: 2, label: 'Week 2' },
  { value: 3, label: 'Week 3' },
  { value: 4, label: 'Week 4' },
  { value: 5, label: 'Week 5' },
  { value: 6, label: 'Week 6' },
];

const TARGET_OPTIONS = [
  { value: 5, label: '5' },
  { value: 8, label: '8' },
  { value: 10, label: '10' },
  { value: 12, label: '12' },
  { value: 15, label: '15' },
  { value: 20, label: '20' },
];

/* Reusable pill legend component */
function LegendPill({ color, label }: { color: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

/* Reusable empty state component */
function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center px-4">
      <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] flex items-center justify-center mb-3">
        <Icon size={24} className="text-[#94A3B8]" />
      </div>
      <p className="text-[15px] font-semibold text-[#1E293B] mb-1">{title}</p>
      <p className="text-[13px] text-[#94A3B8] max-w-[280px]">{description}</p>
    </div>
  );
}

export default function Reports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedLocationName, setSelectedLocationName] = useState<string | null>(
    searchParams.get('location')
  );
  const [reportType, setReportType] = useState<ReportType>('tech_points_by_location');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [timeRange, setTimeRange] = useState<'one_week' | 'four_weeks'>('one_week');
  const [target, setTarget] = useState(10);
  const [providerSearch, setProviderSearch] = useState('');
  const [compareMonth1, setCompareMonth1] = useState(format(new Date(), 'yyyy-MM'));
  const [compareMonth2, setCompareMonth2] = useState(
    format(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1), 'yyyy-MM')
  );
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [weeklySearch, setWeeklySearch] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: locations = [], isLoading: locationsLoading } = useLocations();

  // Set first location as selected by default
  useEffect(() => {
    if (!selectedLocationName && locations.length > 0) {
      setSelectedLocationName(locations[0].name);
    }
  }, [locations, selectedLocationName]);

  // Report data hooks
  const { data: techPointsData, isLoading: techLoading } = useTechPointsByLocation(
    selectedLocationName || '',
    selectedMonth,
    timeRange
  );
  const { data: monthlyPointsData, isLoading: monthlyLoading } = useMonthlyTechPoints(
    selectedLocationName || '',
    selectedMonth
  );
  const { data: providerPointsData, isLoading: providerLoading } = useScheduledPointsByProvider(
    selectedLocationName || '',
    selectedMonth
  );
  const { data: fteData, isLoading: fteLoading } = usePointsPaidTechFTE(
    compareMonth1,
    compareMonth2
  );
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyPointsByLocation(
    selectedMonth,
    selectedWeek
  );

  const handleLocationSelect = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    if (loc) {
      setSelectedLocationName(loc.name);
      setSearchParams({ location: loc.name });
    }
  };

  const selectedLocation = locations.find((l) => l.name === selectedLocationName);

  // Check if FTE report (no month selector)
  const isFTEReport = reportType === 'points_paid_tech_fte';

  const renderReportContent = () => {
    if (!selectedLocationName && reportType !== 'points_paid_tech_fte') {
      return (
        <EmptyState
          icon={Search}
          title="Select a location"
          description="Choose a location from the sidebar to view reports"
        />
      );
    }

    switch (reportType) {
      case 'tech_points_by_location':
        return (
          <div>
            {/* Title + controls */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#1E293B]">
                  Tech Points by Location :{' '}
                  {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Legend pills */}
                <div className="flex items-center gap-2 mr-2">
                  <LegendPill color="#4338CA" label="Morning" />
                  <LegendPill color="#A5B4FC" label="Afternoon" />
                </div>
                {/* Target dropdown */}
                <div className="w-[80px]">
                  <Select
                    size="sm"
                    options={TARGET_OPTIONS}
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                  />
                </div>
                {/* Time range */}
                <div className="w-[130px]">
                  <Select
                    size="sm"
                    options={TIME_RANGE_OPTIONS}
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as 'one_week' | 'four_weeks')}
                  />
                </div>
              </div>
            </div>

            {techLoading ? (
              <LoadingSpinner className="h-64" />
            ) : techPointsData && techPointsData.techs.length > 0 ? (
              <div>
                {techPointsData.techs.map((tech) => (
                  <TechPointsBarChart
                    key={tech.rooming_tech}
                    data={tech}
                    target={target}
                    locationName={techPointsData.location_name}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No data available"
                description="No tech points data available for this location and time period"
              />
            )}
          </div>
        );

      case 'monthly_tech_points':
        return (
          <div>
            {/* Title + controls */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#1E293B]">
                  Tech Points by Tech/ Dept. :{' '}
                  {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
                </h2>
                {selectedLocation && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[13px] text-[#475569]">
                      Clinic Manager:
                    </span>
                    <div className="w-6 h-6 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-[10px] font-medium">
                      {selectedLocation.manager_name?.charAt(0) || 'M'}
                    </div>
                    <span className="text-[13px] font-medium text-[#1E293B]">
                      {selectedLocation.manager_name || 'Not assigned'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <LegendPill color="#0D9488" label="Morning" />
                <LegendPill color="#5EEAD4" label="Afternoon" />
              </div>
            </div>

            {monthlyLoading ? (
              <LoadingSpinner className="h-64" />
            ) : monthlyPointsData && monthlyPointsData.techs.length > 0 ? (
              <div>
                {monthlyPointsData.techs.map((tech) => (
                  <MonthlyTechPointsChart
                    key={tech.rooming_tech}
                    data={tech}
                    target={target}
                    locationName={monthlyPointsData.location_name}
                    clinicManager={selectedLocation?.manager_name}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Calendar}
                title="No monthly data"
                description="No monthly data available for this location"
              />
            )}
          </div>
        );

      case 'scheduled_points_by_provider':
        return (
          <div>
            {/* Title + controls */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#1E293B]">
                  Scheduled Points by Provider (5.1 - 5.5)
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Legend pills */}
                <div className="flex items-center gap-2">
                  <LegendPill color="#4338CA" label="Morning" />
                  <LegendPill color="#A5B4FC" label="Afternoon" />
                </div>
                {/* Search bar */}
                <div className="w-full sm:w-[200px]">
                  <Input
                    placeholder="Search providers..."
                    value={providerSearch}
                    onChange={(e) => setProviderSearch(e.target.value)}
                    leftIcon={<Search size={16} />}
                    className="!min-h-[36px] !py-1.5 !text-[13px]"
                  />
                </div>
              </div>
            </div>

            {providerLoading ? (
              <LoadingSpinner className="h-64" />
            ) : providerPointsData && providerPointsData.managers.length > 0 ? (
              <ProviderPointsChart
                data={providerPointsData.managers}
                searchQuery={providerSearch}
              />
            ) : (
              <EmptyState
                icon={Users}
                title="No provider data"
                description="No provider data available for this location"
              />
            )}
          </div>
        );

      case 'points_paid_tech_fte':
        return (
          <div>
            {/* Title + controls */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#1E293B]">
                Points Paid Tech FTE
              </h2>
              <div className="flex items-center gap-2">
                <LegendPill
                  color="#4338CA"
                  label={MONTH_OPTIONS.find((m) => m.value === compareMonth1)?.label || compareMonth1}
                />
                <LegendPill
                  color="#0D9488"
                  label={MONTH_OPTIONS.find((m) => m.value === compareMonth2)?.label || compareMonth2}
                />
              </div>
            </div>

            {/* Month comparison selectors */}
            <div className="mb-6">
              <p className="text-[13px] text-[#475569] mb-2">
                Select any two months to compare
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="sm:w-[200px]">
                  <Select
                    size="sm"
                    options={MONTH_OPTIONS}
                    value={compareMonth1}
                    onChange={(e) => setCompareMonth1(e.target.value)}
                  />
                </div>
                <div className="sm:w-[200px]">
                  <Select
                    size="sm"
                    options={MONTH_OPTIONS}
                    value={compareMonth2}
                    onChange={(e) => setCompareMonth2(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {fteLoading ? (
              <LoadingSpinner className="h-64" />
            ) : fteData && fteData.data.length > 0 ? (
              <FTEComparisonChart
                data={fteData.data}
                month1Label={
                  MONTH_OPTIONS.find((m) => m.value === compareMonth1)?.label || compareMonth1
                }
                month2Label={
                  MONTH_OPTIONS.find((m) => m.value === compareMonth2)?.label || compareMonth2
                }
              />
            ) : (
              <EmptyState
                icon={BarChart3}
                title="No FTE data"
                description="No FTE comparison data available for the selected months"
              />
            )}
          </div>
        );

      case 'weekly_points_by_day':
        return (
          <div>
            {/* Title + controls */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <h2 className="text-[18px] sm:text-[20px] font-semibold text-[#1E293B]">
                Scheduled Points by day by Location
              </h2>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Legend pills */}
                <div className="flex items-center gap-2">
                  <LegendPill color="#4338CA" label="Morning" />
                  <LegendPill color="#A5B4FC" label="Afternoon" />
                  <LegendPill color="#7C3AED" label="Total" />
                </div>
                {/* Week dropdown */}
                <div className="w-[110px]">
                  <Select
                    size="sm"
                    options={WEEK_OPTIONS}
                    value={selectedWeek}
                    onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  />
                </div>
                {/* Search bar */}
                <div className="w-full sm:w-[180px]">
                  <Input
                    placeholder="Search..."
                    value={weeklySearch}
                    onChange={(e) => setWeeklySearch(e.target.value)}
                    leftIcon={<Search size={16} />}
                    className="!min-h-[36px] !py-1.5 !text-[13px]"
                  />
                </div>
              </div>
            </div>

            {weeklyLoading ? (
              <LoadingSpinner className="h-64" />
            ) : weeklyData && weeklyData.locations.length > 0 ? (
              <WeeklyPointsGrid
                data={
                  weeklySearch
                    ? weeklyData.locations.filter((loc) =>
                        loc.location_name.toLowerCase().includes(weeklySearch.toLowerCase())
                      )
                    : weeklyData.locations
                }
              />
            ) : (
              <EmptyState
                icon={Table2}
                title="No weekly data"
                description="No weekly data available for the selected period"
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Dynamic page title based on selected location
  const getPageTitle = () => {
    if (selectedLocationName) {
      return `${selectedLocationName} Reports`;
    }
    return 'Reports';
  };

  return (
    <div className="flex h-full">
      {/* Location Sidebar */}
      <LocationSidebar
        locations={locations}
        selectedLocationName={selectedLocationName}
        onSelectLocation={handleLocationSelect}
        isLoading={locationsLoading}
        isMobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* Mobile sidebar toggle FAB */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 left-6 z-30 w-14 h-14 rounded-full bg-[#4F46E5] text-white shadow-lg hover:shadow-xl flex items-center justify-center active:scale-95"
          aria-label="Open location selector"
        >
          <MapPin size={22} />
        </button>

        {/* Page title */}
        <h2 className="text-[24px] font-bold text-[#1E293B] mb-6">
          {getPageTitle()}
        </h2>

        {/* Control bar: Select report + Select month */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6 mb-8">
          {/* Select report */}
          <div className="flex-1">
            <Select
              label="Select report"
              options={REPORT_OPTIONS}
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              size="sm"
            />
          </div>

          {/* Select month */}
          <div className="sm:w-[200px]">
            {isFTEReport ? (
              <div>
                <label className="block text-[13px] font-medium text-[#475569] mb-1.5">Select Month</label>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 h-9 flex items-center text-[13px] text-[#94A3B8] shadow-sm">
                  N/A
                </div>
              </div>
            ) : (
              <Select
                label="Select Month"
                options={MONTH_OPTIONS}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                size="sm"
              />
            )}
          </div>
        </div>

        {/* Report content */}
        {renderReportContent()}
      </div>
    </div>
  );
}
