import { useState } from 'react';
import { Users, Plus, Search, Edit2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { usersApi } from '../services/api';

export default function Employees() {
  const [search, setSearch] = useState('');

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Client-side filter
  const users = allUsers.filter(
    (u) =>
      !search ||
      (u.full_name && u.full_name.toLowerCase().includes(search.toLowerCase())) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase())
  );

  const roleLabel = (role: string) => {
    switch (role) {
      case 'clinic_admin':
        return 'Admin';
      case 'clinic_manager':
        return 'Manager';
      default:
        return role;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1E293B]">Users</h1>
          <p className="text-sm text-[#94A3B8] mt-1">
            Manage your team members and their roles
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />}>Add User</Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5] placeholder:text-[#94A3B8] min-h-[44px]"
          />
        </div>
      </Card>

      {/* Users */}
      {isLoading ? (
        <LoadingSpinner className="h-48" />
      ) : users.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users size={40} className="mx-auto text-[#94A3B8] mb-3" />
            <p className="text-lg font-medium text-[#1E293B]">No users found</p>
            <p className="text-sm text-[#94A3B8] mt-1">
              {search
                ? 'Try adjusting your search'
                : 'Add your first user to get started'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {users.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium shrink-0">
                    {(user.full_name || user.email).charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1E293B] truncate">
                      {user.full_name || user.email}
                    </p>
                    <p className="text-xs text-[#475569] truncate mt-0.5">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="purple">{roleLabel(user.role)}</Badge>
                      <Badge variant={user.is_active ? 'success' : 'default'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  <button className="p-2 rounded hover:bg-gray-100 text-[#94A3B8] hover:text-[#475569] min-h-[44px] min-w-[44px] flex items-center justify-center">
                    <Edit2 size={16} />
                  </button>
                </div>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F3F4F6]">
                      <th className="text-left p-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Email
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Locations
                      </th>
                      <th className="text-left p-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-right p-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-xs font-medium">
                              {(user.full_name || user.email).charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#1E293B]">
                              {user.full_name || user.email}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-[#475569]">{user.email}</td>
                        <td className="p-3">
                          <Badge variant="purple">{roleLabel(user.role)}</Badge>
                        </td>
                        <td className="p-3 text-sm text-[#475569]">
                          {user.locations && user.locations.length > 0
                            ? user.locations.map((l) => l.name).join(', ')
                            : '--'}
                        </td>
                        <td className="p-3">
                          <Badge variant={user.is_active ? 'success' : 'default'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button className="p-2 rounded hover:bg-gray-100 text-[#94A3B8] hover:text-[#475569] min-h-[44px] min-w-[44px] flex items-center justify-center">
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
