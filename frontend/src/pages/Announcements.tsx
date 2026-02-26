export default function Announcements() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl font-semibold text-[#1E293B] mb-2">Announcements</h1>
      <p className="text-[#475569] mb-8">Company announcements and updates.</p>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 sm:p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19.4 14.9C20.2 16.4 21 17 21 17H3s3-2 3-9c0-3.3 2.7-6 6-6 .7 0 1.3.1 1.9.3" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            <circle cx="18" cy="8" r="3" />
          </svg>
        </div>
        <h2 className="text-lg font-medium text-[#1E293B] mb-1">No announcements yet</h2>
        <p className="text-sm text-[#94A3B8]">
          Announcements will appear here when they are published.
        </p>
      </div>
    </div>
  );
}
