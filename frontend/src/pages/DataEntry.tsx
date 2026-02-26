import { useState, useRef } from 'react';
import { Upload, FolderOpen, CalendarDays, Plus, ChevronRight, X, Menu } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataEntryTable, emptyRow } from '../components/features/DataEntryTable';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { locationsApi, appointmentTypesApi, appointmentsApi, uploadApi } from '../services/api';
import type { DataEntryRow, AppointmentCreate } from '../types';

type SidebarTab = 'new' | 'drafts' | 'previous';

const INITIAL_ROW_COUNT = 15;

function createInitialRows(): DataEntryRow[] {
  return Array.from({ length: INITIAL_ROW_COUNT }, () => emptyRow());
}

export default function DataEntry() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('new');
  const [rows, setRows] = useState<DataEntryRow[]>(createInitialRows);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getAll(),
  });

  const { data: appointmentTypes = [] } = useQuery({
    queryKey: ['appointment-types'],
    queryFn: () => appointmentTypesApi.getAll(),
  });

  const { data: draftsData, isLoading: draftsLoading } = useQuery({
    queryKey: ['drafts'],
    queryFn: () => appointmentsApi.getDrafts(),
    enabled: activeTab === 'drafts',
  });

  const drafts = draftsData?.appointments || [];

  const toAppointmentCreates = (dataRows: DataEntryRow[]): AppointmentCreate[] => {
    return dataRows
      .filter((r) => r.location_name && r.appointment_type && r.appointment_date)
      .map((r) => ({
        location_name: r.location_name,
        encounter_number: r.encounter_number,
        appointment_type: r.appointment_type,
        appointment_date: r.appointment_date,
        appointment_time: r.appointment_time,
        provider: r.provider,
        rooming_tech: r.rooming_tech,
        check_in_staff: r.check_in_staff,
      }));
  };

  const submitMutation = useMutation({
    mutationFn: () => appointmentsApi.create(toAppointmentCreates(rows)),
    onSuccess: () => {
      setRows(createInitialRows());
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: () => appointmentsApi.saveDraft(toAppointmentCreates(rows)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drafts'] });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadApi.uploadFile(file, 'prospective'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const handleCancel = () => {
    setRows(createInitialRows());
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      e.target.value = '';
    }
  };

  const handleTabChange = (tab: SidebarTab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  const sidebarItems: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { key: 'new', label: 'New Data', icon: <Plus size={16} /> },
    { key: 'drafts', label: 'Drafts', icon: <FolderOpen size={16} /> },
    { key: 'previous', label: 'Previous data', icon: <CalendarDays size={16} /> },
  ];

  const sidebarContent = (
    <>
      {/* Sidebar Header */}
      <div className="px-6 pt-8 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-[24px] sm:text-[28px] font-bold text-[#1E293B] leading-tight">Data Entry</h1>
          <p className="text-[14px] text-[#94A3B8] mt-1">Regularly update your data</p>
        </div>
        {/* Close button - mobile only */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-2 -mr-2 rounded-lg hover:bg-[#F8FAFC] text-[#475569] transition-colors"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="mt-6 px-4 space-y-1">
        {sidebarItems.map((item) => {
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleTabChange(item.key)}
              className={`w-full flex items-center gap-3 px-4 h-[44px] text-[14px] rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#4F46E5] text-white font-medium'
                  : 'text-[#475569] hover:bg-gray-50 font-normal'
              }`}
            >
              <span
                className={`flex items-center justify-center ${
                  isActive && item.key === 'new' ? 'text-[#4ADE80]' : ''
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="flex h-full">
      {/* Hidden file input for upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv,.xls"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-[280px] min-w-[280px] bg-white border-r border-[#F3F4F6] flex-col">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out">
            {sidebarContent}
          </div>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#FAFBFC]">
        {activeTab === 'new' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Header Bar */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-4 sm:py-6 bg-white border-b border-[#E5E7EB]">
              <div className="flex items-center gap-3">
                {/* Mobile sidebar toggle */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[#F8FAFC] text-[#475569] transition-colors"
                  aria-label="Open sidebar"
                >
                  <Menu size={20} />
                </button>
                <h2 className="text-[20px] sm:text-[24px] font-bold text-[#1E293B]">Daily data</h2>
              </div>
              <button
                onClick={handleFileUpload}
                disabled={uploadMutation.isPending}
                className="inline-flex items-center gap-2 px-4 sm:px-5 h-[40px] bg-[#1E293B] text-white text-[14px] font-medium rounded-lg hover:bg-[#334155] transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                <Upload size={16} />
                <span className="hidden sm:inline">{uploadMutation.isPending ? 'Uploading...' : 'Upload file'}</span>
                <span className="sm:hidden">{uploadMutation.isPending ? '...' : 'Upload'}</span>
              </button>
            </div>

            {/* Upload status messages */}
            {uploadMutation.isSuccess && (
              <div className="mx-4 sm:mx-8 mt-4 px-4 py-3 bg-[#ECFDF5] rounded-lg text-[13px] text-[#10B981] font-medium">
                File uploaded successfully!
              </div>
            )}
            {uploadMutation.isError && (
              <div className="mx-4 sm:mx-8 mt-4 px-4 py-3 bg-red-50 rounded-lg text-[13px] text-[#EF4444]">
                Failed to upload file. Please try again.
              </div>
            )}

            {/* Spreadsheet Table */}
            <div className="flex-1 overflow-auto px-4 sm:px-8 py-6">
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <DataEntryTable
                  rows={rows}
                  locations={locations}
                  appointmentTypes={appointmentTypes}
                  onChange={setRows}
                />
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 px-4 sm:px-8 py-4 bg-white border-t border-[#E5E7EB]">
              {submitMutation.isSuccess && (
                <span className="text-[13px] text-[#10B981] font-medium sm:mr-auto">
                  Data submitted successfully!
                </span>
              )}
              {submitMutation.isError && (
                <span className="text-[13px] text-[#EF4444] sm:mr-auto">
                  Failed to submit data. Please try again.
                </span>
              )}
              <button
                onClick={handleCancel}
                className="text-[14px] text-[#475569] font-medium hover:text-[#1E293B] transition-colors px-4 py-2 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => saveDraftMutation.mutate()}
                disabled={saveDraftMutation.isPending}
                className="inline-flex items-center justify-center px-5 min-h-[44px] text-[14px] font-medium text-[#4F46E5] border border-[#4F46E5] bg-white rounded-lg hover:bg-[#EEF2FF] transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                {saveDraftMutation.isPending ? 'Saving...' : 'Save as draft'}
              </button>
              <button
                onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending}
                className="inline-flex items-center justify-center w-full sm:w-[120px] min-h-[44px] text-[14px] font-medium text-white bg-[#4F46E5] rounded-lg hover:bg-[#4338CA] transition-colors disabled:opacity-50 active:scale-[0.98]"
              >
                {submitMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'drafts' && (
          <div className="flex-1 overflow-auto px-4 sm:px-8 py-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[#F8FAFC] text-[#475569] transition-colors"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-[24px] font-bold text-[#1E293B]">Drafts</h2>
            </div>
            {draftsLoading ? (
              <LoadingSpinner className="h-48" />
            ) : drafts.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
                <div className="text-center py-12">
                  <FolderOpen size={32} className="mx-auto text-[#94A3B8] mb-3" />
                  <p className="text-[14px] text-[#94A3B8]">No drafts saved yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex items-center justify-between cursor-pointer hover:border-[#4F46E5] hover:shadow-md transition-all duration-200"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-[#1E293B]">
                        {draft.location_name} - {draft.appointment_type}
                      </p>
                      <p className="text-[12px] text-[#94A3B8] mt-0.5">
                        {draft.appointment_date} - {draft.provider}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-[#94A3B8]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'previous' && (
          <div className="flex-1 overflow-auto px-4 sm:px-8 py-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-[#F8FAFC] text-[#475569] transition-colors"
                aria-label="Open sidebar"
              >
                <Menu size={20} />
              </button>
              <h2 className="text-[24px] font-bold text-[#1E293B]">Previous Data</h2>
            </div>
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
              <div className="text-center py-12">
                <CalendarDays size={32} className="mx-auto text-[#94A3B8] mb-3" />
                <p className="text-[14px] text-[#94A3B8]">Previous data entries will appear here</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
