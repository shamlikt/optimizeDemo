import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface TopBarProps {
  onMenuToggle: () => void;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/reports': 'Reports',
  '/data-entry': 'Data Entry',
  '/upload': 'Upload File',
  '/locations': 'Locations',
  '/employees': 'Employees',
  '/announcements': 'Announcements',
  '/settings': 'Settings',
};

export function TopBar({ onMenuToggle }: TopBarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pageTitle = routeTitles[location.pathname] || 'Dashboard';

  // Close avatar dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[52px] bg-white border-b border-[#F3F4F6] flex items-center justify-between px-4 sm:px-6 shrink-0">
      {/* Left: Hamburger (mobile) + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#475569] hover:text-[#1E293B]"
          aria-label="Toggle navigation menu"
        >
          <Menu size={20} strokeWidth={1.8} />
        </button>
        <h1 className="text-[15px] font-semibold text-[#1E293B]">{pageTitle}</h1>
      </div>

      {/* Right: Bell + Avatar */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notification bell */}
        <button
          className="relative p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#475569] hover:text-[#1E293B]"
          title="Notifications"
        >
          <Bell size={20} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
        </button>

        {/* Avatar with dropdown */}
        <div className="relative ml-1" ref={menuRef}>
          <button
            onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#F3F4F6] bg-[#4F46E5] text-white text-sm font-medium hover:border-[#D1D5DB] focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 active:scale-95"
            title={user?.full_name || 'User menu'}
          >
            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </button>

          {/* Dropdown menu */}
          {avatarMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-[0_4px_16px_-2px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.06)] border border-[#F3F4F6] py-1 z-50">
              {/* User info */}
              <div className="px-4 py-3 border-b border-[#F3F4F6]">
                <p className="text-sm font-medium text-[#1E293B]">
                  {user?.full_name || 'User'}
                </p>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  {user?.email || ''}
                </p>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <Link
                  to="/dashboard"
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B] transition-colors"
                >
                  <User size={16} strokeWidth={1.8} />
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setAvatarMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                >
                  <LogOut size={16} strokeWidth={1.8} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
