import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BarChart3,
  Database,
  Table,
  Upload,
  Sliders,
  MapPin,
  Users,
  Bell,
  Settings,
  ChevronDown,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} strokeWidth={1.8} /> },
  { path: '/reports', label: 'Reports', icon: <BarChart3 size={20} strokeWidth={1.8} /> },
];

const dataManagementItems: NavItem[] = [
  { path: '/data-entry', label: 'Data Entry', icon: <Table size={20} strokeWidth={1.8} /> },
  { path: '/upload', label: 'Upload File', icon: <Upload size={20} strokeWidth={1.8} /> },
  { path: '/point-mapping', label: 'Point Mapping', icon: <Sliders size={20} strokeWidth={1.8} /> },
];

const secondaryNavItems: NavItem[] = [
  { path: '/locations', label: 'Locations', icon: <MapPin size={20} strokeWidth={1.8} /> },
  { path: '/employees', label: 'Employees', icon: <Users size={20} strokeWidth={1.8} /> },
  { path: '/announcements', label: 'Announcements', icon: <Bell size={20} strokeWidth={1.8} /> },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dataOpen, setDataOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;
  const isDataSection = location.pathname === '/data-entry' || location.pathname === '/upload' || location.pathname === '/point-mapping';

  // Auto-expand Data Management if a child route is active
  useEffect(() => {
    if (isDataSection) {
      setDataOpen(true);
    }
  }, [isDataSection]);

  // Close mobile sidebar on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);  // eslint-disable-line react-hooks/exhaustive-deps

  const renderNavItem = (item: NavItem, indent = false) => {
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        className={`
          flex items-center gap-3 h-[40px] rounded-lg text-[14px] font-medium relative
          ${indent ? 'pl-11 pr-3' : 'px-3'}
          ${
            active
              ? 'bg-[#EEF2FF] text-[#4F46E5]'
              : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
          }
        `}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#4F46E5] rounded-r-full" />
        )}
        <span className={active ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}>
          {item.icon}
        </span>
        {item.label}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo + Brand */}
      <div className="flex items-center justify-between px-4 h-[60px] shrink-0 mb-6">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#0891B2] flex items-center justify-center">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M12 6C8.69 6 6 8.69 6 12s2.69 6 6 6"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-[#1E293B] text-[15px] tracking-wide">
              OPTIMIZE
            </span>
            <span className="text-[11px] font-medium text-[#475569] tracking-wider">
              HEALTHCARE
            </span>
          </div>
        </Link>

        {/* Close button - mobile only */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-[#F8FAFC] text-[#475569]"
          aria-label="Close sidebar"
        >
          <X size={20} strokeWidth={1.8} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* Main items */}
        {mainNavItems.map((item) => renderNavItem(item))}

        {/* Data Management - collapsible */}
        <div>
          <button
            onClick={() => setDataOpen(!dataOpen)}
            className={`
              flex items-center justify-between w-full h-[40px] px-3 rounded-lg text-[14px] font-medium
              ${
                isDataSection && !dataOpen
                  ? 'bg-[#EEF2FF] text-[#4F46E5]'
                  : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
              }
            `}
          >
            <div className="flex items-center gap-3">
              <span className={isDataSection ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}>
                <Database size={20} strokeWidth={1.8} />
              </span>
              Data Management
            </div>
            <ChevronDown
              size={16}
              strokeWidth={1.8}
              className={`text-[#94A3B8] transition-transform duration-200 ${
                dataOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Collapsible children with left border connector */}
          <div
            className={`overflow-hidden transition-all duration-200 ${
              dataOpen ? 'max-h-[250px] opacity-100 mt-1' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="ml-[22px] border-l-2 border-[#F3F4F6] space-y-1 pl-0">
              {dataManagementItems.map((item) => renderNavItem(item, true))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[#F3F4F6] my-2" />

        {/* Secondary items */}
        {secondaryNavItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Bottom section: Settings + User */}
      <div className="shrink-0 border-t border-[#F3F4F6] px-3 py-3 space-y-1">
        {/* Settings */}
        <Link
          to="/settings"
          className={`
            flex items-center gap-3 h-[40px] px-3 rounded-lg text-[14px] font-medium
            ${
              isActive('/settings')
                ? 'bg-[#EEF2FF] text-[#4F46E5]'
                : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
            }
          `}
        >
          <span className={isActive('/settings') ? 'text-[#4F46E5]' : 'text-[#94A3B8]'}>
            <Settings size={20} strokeWidth={1.8} />
          </span>
          Settings
        </Link>

        {/* User info + Logout */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center text-white text-sm font-medium shrink-0">
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[#1E293B] truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-[11px] text-[#94A3B8] truncate">
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#EF4444]"
            title="Sign out"
          >
            <LogOut size={16} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[240px] min-w-[240px] bg-white border-r border-[#F3F4F6] flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-[240px] max-w-[85vw] bg-white shadow-xl flex flex-col sidebar-slide-in">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
