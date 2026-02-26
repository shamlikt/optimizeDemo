import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: 'sm' | 'md';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, size = 'md', className = '', ...props }, ref) => {
    const sizes = {
      sm: 'h-9 text-[13px] px-3 pr-9',
      md: 'min-h-[44px] text-sm px-4 pr-10',
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-[13px] font-medium text-[#475569] mb-1.5">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              w-full rounded-lg border border-[#E2E8F0] bg-white
              ${sizes[size]}
              text-[#1E293B] appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5]
              hover:border-[#CBD5E1]
              disabled:bg-[#F8FAFC] disabled:text-[#94A3B8] disabled:cursor-not-allowed
              shadow-sm transition-all duration-150
              ${error ? 'border-[#EF4444] focus:ring-[#EF4444]/20 focus:border-[#EF4444]' : ''}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={size === 'sm' ? 14 : 16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
          />
        </div>
        {error && <p className="mt-1 text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
