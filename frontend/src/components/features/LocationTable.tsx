import { useState } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import type { LocationTableRow } from '../../types';

interface LocationTableProps {
  locations: LocationTableRow[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function LocationTable({ locations, isLoading, searchValue, onSearchChange }: LocationTableProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const navigate = useNavigate();

  const search = searchValue !== undefined ? searchValue : internalSearch;
  const setSearch = onSearchChange || setInternalSearch;

  const filtered = locations.filter(
    (loc) =>
      loc.location_name.toLowerCase().includes(search.toLowerCase()) ||
      loc.manager_name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#F3F4F6] overflow-hidden animate-pulse">
        <div className="p-4 border-b border-[#F3F4F6]">
          <div className="h-8 bg-gray-100 rounded w-64" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-50 flex gap-4">
            <div className="h-4 bg-gray-100 rounded flex-1" />
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[#F3F4F6] overflow-hidden">
      {/* Search bar */}
      <div className="p-4 border-b border-[#F3F4F6]">
        <div className="relative max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
          />
          <input
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent placeholder:text-[#94A3B8] min-h-[44px]"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#94A3B8] text-sm">
            No locations found
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {filtered.map((location) => (
              <div
                key={location.location_id}
                className="p-4 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B] truncate">
                      {location.location_name}
                    </p>
                    <p className="text-xs text-[#475569] mt-1">{location.manager_name}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant="success" size="sm">
                      {location.ytd_points.toLocaleString()} pts
                    </Badge>
                    <span className="text-xs text-[#94A3B8]">{location.num_employees} employees</span>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-3">
                  <button
                    onClick={() => navigate(`/reports?location=${location.location_name}`)}
                    className="flex items-center gap-0.5 text-xs text-[#4F46E5] font-semibold hover:underline min-h-[44px] px-2"
                  >
                    Reports
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Manager
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Employees
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  YTD Points
                </th>
                <th className="text-right p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#94A3B8] text-sm">
                    No locations found
                  </td>
                </tr>
              ) : (
                filtered.map((location) => (
                  <tr
                    key={location.location_id}
                    className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="p-3">
                      <p className="text-sm font-medium text-[#1E293B]">{location.location_name}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-[#475569]">{location.manager_name}</p>
                    </td>
                    <td className="p-3">
                      <p className="text-sm text-[#475569]">{location.num_employees}</p>
                    </td>
                    <td className="p-3">
                      <Badge variant="success" size="sm">
                        {location.ytd_points.toLocaleString()}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => navigate(`/reports?location=${location.location_name}`)}
                        className="inline-flex items-center gap-0.5 text-xs text-[#4F46E5] font-semibold hover:underline min-h-[44px] px-2"
                      >
                        Reports
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
