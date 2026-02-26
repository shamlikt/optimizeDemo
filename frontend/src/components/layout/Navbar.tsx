import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Settings, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const navLinks = [
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/reports', label: 'Reports' },
  { path: '/locations', label: 'Locations' },
  { path: '/employees', label: 'Employees' },
  { path: '/announcements', label: 'Announcements' },
];

export function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname.startsWith(path);

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

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="bg-white border-b border-[#F3F4F6] sticky top-0 z-40">
      <div className="flex items-center justify-between h-[60px] px-4 sm:px-6">
        {/* Hamburger button - visible below md */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#475569] hover:text-[#1E293B]"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={22} strokeWidth={1.8} /> : <Menu size={22} strokeWidth={1.8} />}
        </button>

        {/* Logo + Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
          {/* Teal/blue circular spiral icon */}
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
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-bold text-[#1E293B] text-[15px] tracking-wide">
              OPTIMIZE
            </span>
            <span className="text-[11px] font-medium text-[#475569] tracking-wider">
              HEALTHCARE
            </span>
          </div>
        </Link>

        {/* Center-right Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center gap-1 ml-auto mr-6">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${
                  isActive(link.path)
                    ? 'text-[#1E293B]'
                    : 'text-[#475569] hover:text-[#1E293B] hover:bg-[#F8FAFC]'
                }
              `}
            >
              {isActive(link.path) && (
                <span className="w-2 h-2 rounded-full bg-[#4F46E5] shrink-0" />
              )}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side: Bell, Settings, Avatar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Bell icon with red notification dot */}
          <button
            className="relative p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#475569] hover:text-[#1E293B]"
            title="Notifications"
          >
            <Bell size={20} strokeWidth={1.8} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#EF4444] rounded-full ring-2 ring-white" />
          </button>

          {/* Settings/gear icon - hidden on very small screens */}
          <button
            className="hidden sm:flex p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors text-[#475569] hover:text-[#1E293B]"
            title="Settings"
          >
            <Settings size={20} strokeWidth={1.8} />
          </button>

          {/* Avatar with dropdown */}
          <div className="relative ml-1" ref={menuRef}>
            <button
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[#F3F4F6] bg-[#4F46E5] text-white text-sm font-medium hover:border-[#CBD5E1] transition-colors focus:outline-none focus:ring-2 focus:ring-[#4F46E5] focus:ring-offset-2 active:scale-95"
              title={user?.full_name || 'User menu'}
            >
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </button>

            {/* Dropdown menu */}
            {avatarMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-[#F3F4F6] py-1 z-50">
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
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#F3F4F6] bg-white/95 backdrop-blur-sm">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`
                  flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${
                    isActive(link.path)
                      ? 'bg-[#4F46E5] text-white'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#1E293B]'
                  }
                `}
              >
                {isActive(link.path) && (
                  <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                )}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
