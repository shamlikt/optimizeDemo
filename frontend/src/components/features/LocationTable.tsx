import { useState } from 'react';
import { Search, MoreHorizontal, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Badge } from '../ui/Badge';
import type { LocationTableRow } from '../../types';

interface LocationTableProps {
  locations: LocationTableRow[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

// Generate deterministic sparkline data from location name
function generateSparklineData(name: string): { v: number }[] {
  let seed = 0;
  for (let i = 0; i < name.length; i++) {
    seed = ((seed << 5) - seed + name.charCodeAt(i)) | 0;
  }
  const data: { v: number }[] = [];
  for (let i = 0; i < 10; i++) {
    seed = (seed * 16807) % 2147483647;
    data.push({ v: 30 + (Math.abs(seed) % 60) });
  }
  return data;
}

// Generate a consistent color for the avatar based on name
function getAvatarColor(name: string): string {
  const colors = ['#6366F1', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

export function LocationTable({ locations, isLoading, searchValue, onSearchChange }: LocationTableProps) {
  const [internalSearch, setInternalSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const search = searchValue !== undefined ? searchValue : internalSearch;
  const setSearch = onSearchChange || setInternalSearch;

  const filtered = locations.filter(
    (loc) =>
      loc.location_name.toLowerCase().includes(search.toLowerCase()) ||
      loc.manager_name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleRow = (id: string) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
  };

  const toggleAll = () => {
    if (selectedRows.size === filtered.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filtered.map((l) => l.location_id)));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#F3F4F6] overflow-hidden animate-pulse">
        <div className="p-4 border-b border-[#F3F4F6]">
          <div className="h-8 bg-gray-100 rounded w-64" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-gray-50 flex gap-4">
            <div className="h-4 bg-gray-100 rounded w-4" />
            <div className="h-4 bg-gray-100 rounded flex-1" />
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-4 bg-gray-100 rounded w-16" />
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
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#94A3B8] text-sm">
            No locations found
          </div>
        ) : (
          <div className="divide-y divide-[#F3F4F6]">
            {filtered.map((location) => {
              const avatarColor = getAvatarColor(location.manager_name || 'M');
              return (
                <div
                  key={location.location_id}
                  className="p-4 hover:bg-[#F8FAFC] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1E293B] truncate">
                        {location.location_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0"
                          style={{ backgroundColor: avatarColor }}
                        >
                          {location.manager_name?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <span className="text-xs text-[#475569] truncate">{location.manager_name}</span>
                      </div>
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
              );
            })}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#F3F4F6]">
                <th className="text-left p-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-[#D1D5DB] text-[#4F46E5] focus:ring-[#4F46E5]"
                  />
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Location Address
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Location Name
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Location Abbrev.
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Manager
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  # Employees
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  YTD Paid FTEs
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  YTD Points
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Activity
                </th>
                <th className="text-left p-3 text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-[#94A3B8] text-sm">
                    No locations found
                  </td>
                </tr>
              ) : (
                filtered.map((location) => {
                  const sparkData = generateSparklineData(location.location_name);
                  const avatarColor = getAvatarColor(location.manager_name || 'M');
                  const abbreviation = location.location_name
                    .split(/\s+/)
                    .map((w) => w.charAt(0).toUpperCase())
                    .join('');
                  const ytdPaidFtes = location.appointment_count > 0
                    ? (location.appointment_count / 12).toFixed(1)
                    : '0.0';

                  return (
                    <tr
                      key={location.location_id}
                      className="border-b border-gray-50 hover:bg-[#F8FAFC] transition-colors"
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(location.location_id)}
                          onChange={() => toggleRow(location.location_id)}
                          className="rounded border-[#D1D5DB] text-[#4F46E5] focus:ring-[#4F46E5]"
                        />
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-[#475569] truncate max-w-[180px]">
                          {location.location_name}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-medium text-[#1E293B]">{location.location_name}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-[#475569]">{abbreviation}</p>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0"
                            style={{ backgroundColor: avatarColor }}
                          >
                            {location.manager_name?.charAt(0)?.toUpperCase() || 'M'}
                          </div>
                          <span className="text-sm text-[#475569] whitespace-nowrap">{location.manager_name}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-[#475569]">{location.num_employees}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-[#475569]">{ytdPaidFtes}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant="success" size="sm">
                          {location.ytd_points.toLocaleString()}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="w-[80px] h-[28px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sparkData}>
                              <Line
                                type="monotone"
                                dataKey="v"
                                stroke="#6366F1"
                                strokeWidth={1.5}
                                dot={false}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/reports?location=${location.location_name}`)}
                            className="flex items-center gap-0.5 text-xs text-[#4F46E5] font-semibold hover:underline whitespace-nowrap min-h-[44px]"
                          >
                            Reports
                            <ChevronRight size={14} />
                          </button>
                          <button className="p-1 rounded hover:bg-gray-100 text-[#94A3B8] min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
