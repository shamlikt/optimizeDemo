import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload as UploadIcon,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  CloudUpload,
  Clock,
  CalendarCheck,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Copy,
  Ban,
  SkipForward,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { uploadApi } from '../services/api';
import { Modal } from '../components/ui/Modal';
import type { UploadResponse } from '../types';

// Required CSV column headers (case-insensitive match)
const REQUIRED_COLUMNS_RETROSPECTIVE = [
  'Location',
  'Rooming Tech',
  'Provider',
  'Specialty',
  'Appt Date',
  'Appt Time',
  'Check In',
];

const REQUIRED_COLUMNS_PROSPECTIVE = [
  'Location',
  'Provider',
  'Specialty',
  'Appt Date',
  'Appt Time',
];

/**
 * Parse the first line of a CSV file to extract column headers.
 * Returns an array of trimmed header strings.
 */
function parseCSVHeaders(text: string): string[] {
  const firstLine = text.split(/\r?\n/)[0] || '';
  return firstLine.split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
}

/**
 * Validate CSV headers against required columns.
 * Returns an array of missing column names.
 */
function findMissingColumns(headers: string[], required: string[]): string[] {
  const headersLower = headers.map((h) => h.toLowerCase());
  return required.filter((col) => !headersLower.includes(col.toLowerCase()));
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadType, setUploadType] = useState<'retrospective' | 'prospective'>('retrospective');
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [missingColumns, setMissingColumns] = useState<string[]>([]);
  const [showMissingModal, setShowMissingModal] = useState(false);

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return uploadApi.uploadFile(file, uploadType);
    },
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const validateAndSetFile = useCallback(
    (droppedFile: File) => {
      // Only validate CSV files on the frontend; XLSX will be validated by backend
      if (droppedFile.name.toLowerCase().endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const text = e.target?.result as string;
          const headers = parseCSVHeaders(text);
          const requiredCols =
            uploadType === 'retrospective'
              ? REQUIRED_COLUMNS_RETROSPECTIVE
              : REQUIRED_COLUMNS_PROSPECTIVE;
          const missing = findMissingColumns(headers, requiredCols);

          if (missing.length > 0) {
            setMissingColumns(missing);
            setShowMissingModal(true);
            // Don't set the file — user needs to fix the CSV
          } else {
            setFile(droppedFile);
            setResult(null);
            setMissingColumns([]);
          }
        };
        // Read only the first 4KB to get headers
        reader.readAsText(droppedFile.slice(0, 4096));
      } else {
        // Non-CSV files pass through (backend validates)
        setFile(droppedFile);
        setResult(null);
      }
    },
    [uploadType]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        validateAndSetFile(acceptedFiles[0]);
      }
    },
    [validateAndSetFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate();
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setMissingColumns([]);
    uploadMutation.reset();
  };

  const currentStep = result ? 3 : file ? 2 : 1;

  // Computed result stats
  const skippedRows = result ? result.row_count - result.valid_row_count : 0;
  const insertedRows = result ? result.valid_row_count - result.duplicate_count : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* ===== Missing Columns Modal ===== */}
      <Modal
        isOpen={showMissingModal}
        onClose={() => setShowMissingModal(false)}
        title="Missing Required Columns"
        size="md"
      >
        <div className="space-y-5">
          {/* Warning icon + message */}
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#FEF3C7] shrink-0">
              <ShieldAlert size={22} className="text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1E293B]">
                Your CSV is missing {missingColumns.length} required column{missingColumns.length > 1 ? 's' : ''}
              </p>
              <p className="text-[13px] text-[#64748B] mt-1">
                Please add the following columns to your CSV file and try again.
              </p>
            </div>
          </div>

          {/* Missing columns list */}
          <div className="bg-[#FFF7ED] border border-[#FFEDD5] rounded-xl p-4">
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
              Missing Columns
            </p>
            <div className="space-y-2">
              {missingColumns.map((col) => (
                <div
                  key={col}
                  className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-lg border border-[#FDE68A]"
                >
                  <div className="w-6 h-6 rounded-md bg-[#FEF3C7] flex items-center justify-center shrink-0">
                    <X size={12} className="text-[#F59E0B]" />
                  </div>
                  <span className="text-[14px] font-medium text-[#1E293B]">{col}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expected columns reference */}
          <div className="bg-[#F8FAFC] rounded-xl p-4">
            <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
              All Required Columns
            </p>
            <div className="flex flex-wrap gap-2">
              {(uploadType === 'retrospective'
                ? REQUIRED_COLUMNS_RETROSPECTIVE
                : REQUIRED_COLUMNS_PROSPECTIVE
              ).map((col) => {
                const isMissing = missingColumns.includes(col);
                return (
                  <span
                    key={col}
                    className={`inline-flex items-center gap-1.5 text-[13px] font-medium px-3 py-1.5 rounded-full ${
                      isMissing
                        ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                        : 'bg-[#ECFDF5] text-[#065F46] border border-[#D1FAE5]'
                    }`}
                  >
                    {isMissing ? <X size={11} /> : <CheckCircle2 size={11} />}
                    {col}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowMissingModal(false)}
            className="w-full inline-flex items-center justify-center gap-2 px-5 h-[46px] text-[14px] font-semibold text-white bg-[#4F46E5] rounded-xl hover:bg-[#4338CA] transition-colors active:scale-[0.98]"
          >
            Got it, I'll fix my CSV
          </button>
        </div>
      </Modal>

      {/* ===== Header ===== */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] shadow-lg shadow-indigo-200 mb-4">
          <CloudUpload size={28} className="text-white" />
        </div>
        <h1 className="text-[28px] font-bold text-[#1E293B]">Upload Data</h1>
        <p className="text-[15px] text-[#94A3B8] mt-1 max-w-md mx-auto">
          Import your CSV files to sync visit points data with the platform
        </p>
      </div>

      {/* ===== Step indicator ===== */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {[
          { num: 1, label: 'Select type' },
          { num: 2, label: 'Upload file' },
          { num: 3, label: 'Results' },
        ].map((step, i) => (
          <div key={step.num} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-all duration-300 ${
                  currentStep >= step.num
                    ? 'bg-[#4F46E5] text-white shadow-md shadow-indigo-200'
                    : 'bg-[#F1F5F9] text-[#94A3B8]'
                }`}
              >
                {currentStep > step.num ? <CheckCircle2 size={16} /> : step.num}
              </div>
              <span
                className={`text-[13px] font-medium hidden sm:inline ${
                  currentStep >= step.num ? 'text-[#1E293B]' : 'text-[#94A3B8]'
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={`w-12 sm:w-20 h-[2px] mx-3 rounded-full transition-colors duration-300 ${
                  currentStep > step.num ? 'bg-[#4F46E5]' : 'bg-[#E5E7EB]'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ===== Upload type selector ===== */}
      {!result && (
        <div className="mb-8">
          <p className="text-[13px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
            Data Type
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => { setUploadType('retrospective'); clearFile(); }}
              className={`group relative flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                uploadType === 'retrospective'
                  ? 'border-[#4F46E5] bg-[#EEF2FF] shadow-md shadow-indigo-100'
                  : 'border-[#E5E7EB] bg-white hover:border-[#C7D2FE] hover:shadow-sm'
              }`}
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors ${
                  uploadType === 'retrospective'
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-[#E0E7FF] group-hover:text-[#4F46E5]'
                }`}
              >
                <Clock size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#1E293B]">Retrospective</p>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Historical visit data from completed appointments
                </p>
              </div>
              {uploadType === 'retrospective' && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 size={18} className="text-[#4F46E5]" />
                </div>
              )}
            </button>

            <button
              onClick={() => { setUploadType('prospective'); clearFile(); }}
              className={`group relative flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                uploadType === 'prospective'
                  ? 'border-[#4F46E5] bg-[#EEF2FF] shadow-md shadow-indigo-100'
                  : 'border-[#E5E7EB] bg-white hover:border-[#C7D2FE] hover:shadow-sm'
              }`}
            >
              <div
                className={`flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-colors ${
                  uploadType === 'prospective'
                    ? 'bg-[#4F46E5] text-white'
                    : 'bg-[#F1F5F9] text-[#94A3B8] group-hover:bg-[#E0E7FF] group-hover:text-[#4F46E5]'
                }`}
              >
                <CalendarCheck size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#1E293B]">Prospective</p>
                <p className="text-[13px] text-[#64748B] mt-0.5">
                  Scheduled appointment data for upcoming visits
                </p>
              </div>
              {uploadType === 'prospective' && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 size={18} className="text-[#4F46E5]" />
                </div>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== Dropzone ===== */}
      {!result && (
        <div className="mb-8">
          <p className="text-[13px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
            Upload File
          </p>

          {!file ? (
            <div
              {...getRootProps()}
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                isDragActive
                  ? 'border-[#4F46E5] bg-[#EEF2FF] scale-[1.01] shadow-lg shadow-indigo-100'
                  : 'border-[#D1D5DB] bg-[#FAFBFF] hover:border-[#A5B4FC] hover:bg-[#F5F3FF]'
              }`}
            >
              <input {...getInputProps()} />

              {/* Decorative background */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                <div className="absolute top-6 left-8 w-16 h-16 rounded-xl bg-[#4F46E5] rotate-12" />
                <div className="absolute top-12 right-12 w-10 h-10 rounded-lg bg-[#7C3AED] -rotate-6" />
                <div className="absolute bottom-8 left-1/4 w-12 h-12 rounded-full bg-[#4F46E5] rotate-45" />
                <div className="absolute bottom-6 right-1/3 w-8 h-8 rounded-lg bg-[#7C3AED] rotate-12" />
              </div>

              <div className="relative px-8 py-14 sm:py-16 text-center">
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 transition-all duration-300 ${
                    isDragActive
                      ? 'bg-[#4F46E5] text-white scale-110 shadow-lg shadow-indigo-200'
                      : 'bg-white text-[#94A3B8] shadow-sm border border-[#E5E7EB]'
                  }`}
                >
                  <UploadIcon
                    size={28}
                    className={`transition-transform duration-300 ${isDragActive ? '-translate-y-1' : ''}`}
                  />
                </div>

                {isDragActive ? (
                  <>
                    <p className="text-[16px] font-semibold text-[#4F46E5]">Drop your file here</p>
                    <p className="text-[13px] text-[#6366F1] mt-1">Release to validate & upload</p>
                  </>
                ) : (
                  <>
                    <p className="text-[16px] font-medium text-[#1E293B]">
                      Drag & drop your CSV file here
                    </p>
                    <p className="text-[14px] text-[#94A3B8] mt-1.5">
                      or{' '}
                      <span className="text-[#4F46E5] font-semibold underline underline-offset-2 decoration-[#C7D2FE]">
                        browse from your computer
                      </span>
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-5">
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#94A3B8] bg-white px-3 py-1.5 rounded-full border border-[#F3F4F6]">
                        <FileText size={12} />
                        CSV format
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-[#94A3B8] bg-white px-3 py-1.5 rounded-full border border-[#F3F4F6]">
                        <FileSpreadsheet size={12} />
                        Max 10MB
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* File selected — ready to upload */
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#EEF2FF]">
                  <FileSpreadsheet size={24} className="text-[#4F46E5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[#1E293B] truncate">{file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[13px] text-[#94A3B8]">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
                    <span className="inline-flex items-center gap-1 text-[13px] text-[#10B981] font-medium">
                      <CheckCircle2 size={12} />
                      Columns validated
                    </span>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-2.5 rounded-lg hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#EF4444] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 h-[46px] bg-[#4F46E5] text-white text-[14px] font-semibold rounded-xl hover:bg-[#4338CA] transition-all duration-200 shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      Upload & Process
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                <button
                  onClick={clearFile}
                  className="hidden sm:inline-flex items-center justify-center px-4 h-[46px] text-[14px] font-medium text-[#475569] rounded-xl hover:bg-[#F8FAFC] transition-colors"
                >
                  Change file
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Processing indicator ===== */}
      {uploadMutation.isPending && (
        <div className="mb-8 rounded-2xl border border-[#E0E7FF] bg-[#EEF2FF] p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#4F46E5] flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1E293B]">Processing your file...</p>
              <p className="text-[13px] text-[#64748B]">Validating data and detecting duplicates</p>
            </div>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden">
            <div className="bg-[#4F46E5] h-2.5 rounded-full animate-pulse" style={{ width: '65%' }} />
          </div>
        </div>
      )}

      {/* ===== Success Results ===== */}
      {result && (
        <div className="space-y-6">
          {/* Success / Failed banner */}
          {result.status === 'completed' ? (
            <div className="rounded-2xl border border-[#D1FAE5] bg-gradient-to-r from-[#ECFDF5] to-[#F0FDF4] p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#10B981] shadow-md shadow-emerald-200">
                  <Sparkles size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[18px] font-bold text-[#1E293B]">Upload Complete!</h3>
                  <p className="text-[14px] text-[#64748B] mt-0.5">
                    Your data has been processed successfully. See the breakdown below.
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="hidden sm:inline-flex items-center gap-2 px-5 h-[42px] text-[14px] font-semibold text-[#4F46E5] bg-white border border-[#E0E7FF] rounded-xl hover:bg-[#EEF2FF] transition-colors"
                >
                  <UploadIcon size={16} />
                  Upload another
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#FECDD3] bg-gradient-to-r from-[#FFF1F2] to-[#FEF2F2] p-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#EF4444] shadow-md shadow-red-200">
                  <AlertCircle size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-[18px] font-bold text-[#1E293B]">Upload Failed</h3>
                  <p className="text-[14px] text-[#64748B] mt-0.5">
                    {result.error_message || 'An error occurred while processing your file.'}
                  </p>
                </div>
                <button
                  onClick={clearFile}
                  className="hidden sm:inline-flex items-center gap-2 px-5 h-[42px] text-[14px] font-semibold text-[#4F46E5] bg-white border border-[#E0E7FF] rounded-xl hover:bg-[#EEF2FF] transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Stats breakdown */}
          {result.status === 'completed' && (
            <>
              {/* Main stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-[#E5E7EB] bg-white p-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#F1F5F9] mb-3">
                    <FileText size={20} className="text-[#475569]" />
                  </div>
                  <p className="text-[28px] font-bold text-[#1E293B]">{result.row_count}</p>
                  <p className="text-[12px] font-medium text-[#94A3B8] uppercase tracking-wider mt-1">
                    Total Rows
                  </p>
                </div>
                <div className="rounded-xl border border-[#D1FAE5] bg-[#F0FDF4] p-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#D1FAE5] mb-3">
                    <CheckCircle2 size={20} className="text-[#10B981]" />
                  </div>
                  <p className="text-[28px] font-bold text-[#10B981]">{insertedRows}</p>
                  <p className="text-[12px] font-medium text-[#94A3B8] uppercase tracking-wider mt-1">
                    Inserted
                  </p>
                </div>
                <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#FDE68A] mb-3">
                    <Copy size={20} className="text-[#F59E0B]" />
                  </div>
                  <p className="text-[28px] font-bold text-[#F59E0B]">{result.duplicate_count}</p>
                  <p className="text-[12px] font-medium text-[#94A3B8] uppercase tracking-wider mt-1">
                    Duplicates
                  </p>
                </div>
                <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-5 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#E5E7EB] mb-3">
                    <SkipForward size={20} className="text-[#64748B]" />
                  </div>
                  <p className="text-[28px] font-bold text-[#64748B]">{skippedRows}</p>
                  <p className="text-[12px] font-medium text-[#94A3B8] uppercase tracking-wider mt-1">
                    Skipped
                  </p>
                </div>
              </div>

              {/* Detailed status summary */}
              <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
                <div className="px-5 py-4 border-b border-[#F3F4F6]">
                  <p className="text-[14px] font-semibold text-[#1E293B]">Processing Summary</p>
                </div>
                <div className="divide-y divide-[#F3F4F6]">
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#1E293B]" />
                      <span className="text-[14px] text-[#475569]">Total rows in file</span>
                    </div>
                    <span className="text-[14px] font-semibold text-[#1E293B]">{result.row_count}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="text-[14px] text-[#475569]">Successfully inserted</span>
                    </div>
                    <span className="text-[14px] font-semibold text-[#10B981]">{insertedRows}</span>
                  </div>
                  <div className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="text-[14px] text-[#475569]">Duplicate rows found</span>
                    </div>
                    <span className="text-[14px] font-semibold text-[#F59E0B]">{result.duplicate_count}</span>
                  </div>
                  {skippedRows > 0 && (
                    <div className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#94A3B8]" />
                        <span className="text-[14px] text-[#475569]">
                          Rows skipped (missing required data)
                        </span>
                      </div>
                      <span className="text-[14px] font-semibold text-[#64748B]">{skippedRows}</span>
                    </div>
                  )}
                </div>

                {/* Progress bar visual */}
                {result.row_count > 0 && (
                  <div className="px-5 py-4 bg-[#F8FAFC]">
                    <div className="flex h-3 rounded-full overflow-hidden bg-[#F1F5F9]">
                      {insertedRows > 0 && (
                        <div
                          className="bg-[#10B981] transition-all duration-500"
                          style={{ width: `${(insertedRows / result.row_count) * 100}%` }}
                          title={`${insertedRows} inserted`}
                        />
                      )}
                      {result.duplicate_count > 0 && (
                        <div
                          className="bg-[#F59E0B] transition-all duration-500"
                          style={{ width: `${(result.duplicate_count / result.row_count) * 100}%` }}
                          title={`${result.duplicate_count} duplicates`}
                        />
                      )}
                      {skippedRows > 0 && (
                        <div
                          className="bg-[#CBD5E1] transition-all duration-500"
                          style={{ width: `${(skippedRows / result.row_count) * 100}%` }}
                          title={`${skippedRows} skipped`}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-5 mt-2.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" /> Inserted
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" /> Duplicates
                      </span>
                      {skippedRows > 0 && (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-[#64748B]">
                          <span className="w-2 h-2 rounded-full bg-[#CBD5E1]" /> Skipped
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Duplicate info callout */}
              {result.duplicate_count > 0 && (
                <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#FEF3C7] shrink-0 mt-0.5">
                      <Ban size={16} className="text-[#F59E0B]" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-[#92400E]">
                        {result.duplicate_count} duplicate row{result.duplicate_count > 1 ? 's' : ''} detected
                      </p>
                      <p className="text-[13px] text-[#A16207] mt-0.5">
                        Duplicate rows were processed but marked as excluded from reporting.
                        They won't affect your analytics or dashboards.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Mobile "upload another" button */}
          <div className="sm:hidden">
            <button
              onClick={clearFile}
              className="w-full inline-flex items-center justify-center gap-2 px-5 h-[46px] text-[14px] font-semibold text-[#4F46E5] bg-white border border-[#E0E7FF] rounded-xl hover:bg-[#EEF2FF] transition-colors"
            >
              <UploadIcon size={16} />
              Upload another file
            </button>
          </div>
        </div>
      )}

      {/* ===== Upload error ===== */}
      {uploadMutation.isError && !result && (
        <div className="rounded-xl border border-[#FECDD3] bg-[#FFF1F2] p-5">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#FEE2E2] shrink-0">
              <AlertCircle size={18} className="text-[#EF4444]" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#EF4444]">Upload Failed</p>
              <p className="text-[13px] text-[#64748B] mt-1">
                {(uploadMutation.error as Error)?.message || 'An unexpected error occurred. Please try again.'}
              </p>
            </div>
            <button
              onClick={() => uploadMutation.reset()}
              className="ml-auto p-2 rounded-lg hover:bg-[#FEE2E2] text-[#94A3B8] hover:text-[#EF4444] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
