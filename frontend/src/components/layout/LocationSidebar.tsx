import { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Input } from '../ui/Input';
import type { Location } from '../../types';

interface LocationSidebarProps {
  locations: Location[];
  selectedLocationName: string | null;
  onSelectLocation: (id: string) => void;
  isLoading?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const VISIBLE_COUNT = 20;

export function LocationSidebar({
  locations,
  selectedLocationName,
  onSelectLocation,
  isLoading = false,
  isMobileOpen = false,
  onMobileClose,
}: LocationSidebarProps) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const filtered = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.abbreviation.toLowerCase().includes(search.toLowerCase()) ||
      (loc.address && loc.address.toLowerCase().includes(search.toLowerCase()))
  );

  const visibleLocations = showAll ? filtered : filtered.slice(0, VISIBLE_COUNT);
  const remainingCount = filtered.length - VISIBLE_COUNT;

  const handleSelect = (id: string) => {
    onSelectLocation(id);
    onMobileClose?.();
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="px-5 pt-6 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-[#1E293B] leading-tight">
            Reports
          </h1>
          <p className="text-[13px] text-[#94A3B8] mt-1">
            View organization statistics
          </p>
        </div>
        {/* Close button - mobile only */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-[#F8FAFC] text-[#475569]"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-5 border-b border-[#F3F4F6]" />

      {/* Search section */}
      <div className="px-5 pt-4 pb-2">
        <p className="text-[13px] text-[#475569] mb-3">
          Select location to view reports
        </p>
        <Input
          placeholder="Search location"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowAll(false);
          }}
          leftIcon={<Search size={16} />}
          className="!min-h-[36px] !py-1.5 !text-[13px]"
        />
      </div>

      {/* Locations label - uppercase micro style */}
      <div className="px-5 pt-3 pb-1">
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
          Locations
        </p>
      </div>

      {/* Location list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse h-11 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MapPin size={24} className="mx-auto text-[#94A3B8] mb-2" />
            <p className="text-sm text-[#94A3B8]">
              No locations found
            </p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {visibleLocations.map((location) => {
              const isSelected = selectedLocationName === location.name;
              return (
                <button
                  key={location.id}
                  onClick={() => handleSelect(location.id)}
                  className={`
                    w-full text-left px-3 h-[44px] rounded-lg flex items-center relative
                    ${
                      isSelected
                        ? 'bg-[#EEF2FF] text-[#4F46E5] font-semibold'
                        : 'text-[#1E293B] hover:bg-[#EEF2FF]'
                    }
                  `}
                >
                  {isSelected && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-[#4F46E5] rounded-r-full" />
                  )}
                  <span className="text-[14px] truncate">
                    {location.name}
                  </span>
                </button>
              );
            })}

            {/* Show More link */}
            {!showAll && remainingCount > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full text-left px-3 h-[44px] text-[14px] font-medium text-[#4F46E5] hover:underline flex items-center"
              >
                {remainingCount}+ Show More
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar - inline */}
      <div
        className="hidden lg:flex bg-white border-r border-[#F3F4F6] h-full flex-col w-[280px] min-w-[280px]"
      >
        {sidebarContent}
      </div>

      {/* Mobile sidebar - fixed overlay */}
      {isMobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Sidebar panel */}
          <div
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-[300px] max-w-[85vw] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out"
          >
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
