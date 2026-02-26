import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-[#475569]',
    success: 'bg-[#ECFDF5] text-[#10B981]',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-[#EF4444]',
    info: 'bg-blue-50 text-blue-600',
    purple: 'bg-indigo-50 text-[#6366F1]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </span>
  );
}
