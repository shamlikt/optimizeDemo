import { useState } from 'react';
import { MapPin, Plus, Search, Edit2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { useLocations } from '../hooks/useDashboard';

export default function Locations() {
  const [search, setSearch] = useState('');
  const { data: allLocations = [], isLoading } = useLocations();

  // Client-side filter by search term
  const locations = allLocations.filter(
    (loc) =>
      !search ||
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.abbreviation.toLowerCase().includes(search.toLowerCase()) ||
      (loc.address && loc.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Locations</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Manage your organization locations
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />}>Add Location</Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search locations by name, address, or abbreviation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder:text-[#94A3B8] min-h-[44px]"
          />
        </div>
      </Card>

      {/* Locations Grid */}
      {isLoading ? (
        <LoadingSpinner className="h-48" />
      ) : locations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <MapPin size={40} className="mx-auto text-[#94A3B8] mb-3" />
            <p className="text-lg font-medium text-[#1E293B]">No locations found</p>
            <p className="text-sm text-[#94A3B8] mt-1">
              {search ? 'Try adjusting your search' : 'Add your first location to get started'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((location) => (
            <Card key={location.id} className="hover:border-[#4F46E5] hover:shadow-md transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#EEF2FF] flex items-center justify-center">
                    <MapPin size={20} className="text-[#6366F1]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#1E293B]">{location.name}</h3>
                    <p className="text-xs text-[#94A3B8]">{location.abbreviation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-2 rounded hover:bg-gray-100 text-[#94A3B8] hover:text-[#475569] min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-[#475569] mb-3">{location.address}</p>
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <span>{location.city}, {location.state} {location.postal_code}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex flex-wrap items-center gap-2">
                <Badge variant={location.is_active ? 'success' : 'default'}>
                  {location.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-[#94A3B8]">{location.num_employees} employees</span>
                {location.manager_name && (
                  <span className="text-xs text-[#94A3B8]">- Mgr: {location.manager_name}</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
