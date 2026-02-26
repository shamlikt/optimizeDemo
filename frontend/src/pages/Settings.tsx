import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#1E293B] mb-2">Settings</h1>
      <p className="text-[#475569] mb-8">Manage your account and preferences.</p>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
          <SettingsIcon size={28} className="text-[#94A3B8]" />
        </div>
        <h2 className="text-lg font-medium text-[#1E293B] mb-1">Settings coming soon</h2>
        <p className="text-sm text-[#94A3B8]">
          Account and application settings will be available here.
        </p>
      </div>
    </div>
  );
}
