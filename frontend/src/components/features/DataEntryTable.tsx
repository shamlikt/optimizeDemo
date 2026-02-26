import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { DataEntryRow, Location, AppointmentType } from '../../types';

interface DataEntryTableProps {
  rows: DataEntryRow[];
  locations: Location[];
  appointmentTypes: AppointmentType[];
  onChange: (rows: DataEntryRow[]) => void;
}

function generateId() {
  return `row-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function emptyRow(): DataEntryRow {
  return {
    id: generateId(),
    location_name: '',
    encounter_number: '',
    appointment_type: '',
    appointment_date: '',
    appointment_time: '',
    provider: '',
    rooming_tech: '',
    check_in_staff: '',
  };
}

const COLUMNS = [
  { key: 'location_name' as const, label: 'Location', type: 'select' as const, width: 'w-[140px] min-w-[140px]' },
  { key: 'encounter_number' as const, label: 'Encounter #', type: 'text' as const, width: 'w-[150px] min-w-[150px]' },
  { key: 'appointment_type' as const, label: 'Appt Type', type: 'text' as const, width: 'w-[130px] min-w-[130px]' },
  { key: 'appointment_date' as const, label: 'Day of Appt', type: 'date' as const, width: 'w-[140px] min-w-[140px]' },
  { key: 'appointment_time' as const, label: 'Time*', type: 'time' as const, width: 'w-[120px] min-w-[120px]' },
  { key: 'provider' as const, label: 'Provider**', type: 'text' as const, width: 'w-[160px] min-w-[160px]' },
  { key: 'rooming_tech' as const, label: 'Staff (Worked Up)**', type: 'text' as const, width: 'w-[160px] min-w-[160px]' },
  { key: 'check_in_staff' as const, label: 'Staff (Check In)**', type: 'text' as const, width: 'w-[160px] min-w-[160px]' },
];

export function DataEntryTable({
  rows,
  locations,
  appointmentTypes,
  onChange,
}: DataEntryTableProps) {
  const [focusedRowId, setFocusedRowId] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  const updateRow = (id: string, field: keyof DataEntryRow, value: string) => {
    const updated = rows.map((row) =>
      row.id === id ? { ...row, [field]: value } : row
    );
    onChange(updated);
  };

  const addRow = () => {
    onChange([...rows, emptyRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((row) => row.id !== id));
  };

  const renderCell = (row: DataEntryRow, column: typeof COLUMNS[number]) => {
    const baseInputClass =
      'w-full h-full bg-transparent px-3 py-2 text-[13px] text-[#1E293B] placeholder:text-[#CBD5E1] focus:outline-none font-[Inter] min-h-[44px]';

    if (column.key === 'location_name') {
      return (
        <select
          value={row.location_name}
          onChange={(e) => updateRow(row.id, 'location_name', e.target.value)}
          onFocus={() => setFocusedRowId(row.id)}
          onBlur={() => setFocusedRowId(null)}
          className={`${baseInputClass} appearance-none cursor-pointer pr-8`}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
          }}
        >
          <option value=""></option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.name}>
              {loc.abbreviation ? `${loc.abbreviation} - ${loc.name}` : loc.name}
            </option>
          ))}
        </select>
      );
    }

    if (column.type === 'date') {
      return (
        <input
          type="date"
          value={row[column.key]}
          onChange={(e) => updateRow(row.id, column.key, e.target.value)}
          onFocus={() => setFocusedRowId(row.id)}
          onBlur={() => setFocusedRowId(null)}
          className={baseInputClass}
        />
      );
    }

    if (column.type === 'time') {
      return (
        <input
          type="time"
          value={row[column.key]}
          onChange={(e) => updateRow(row.id, column.key, e.target.value)}
          onFocus={() => setFocusedRowId(row.id)}
          onBlur={() => setFocusedRowId(null)}
          className={baseInputClass}
        />
      );
    }

    return (
      <input
        type="text"
        value={row[column.key]}
        onChange={(e) => updateRow(row.id, column.key, e.target.value)}
        onFocus={() => setFocusedRowId(row.id)}
        onBlur={() => setFocusedRowId(null)}
        className={baseInputClass}
      />
    );
  };

  return (
    <div className="relative">
      {/* Scroll shadow indicator */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
          <thead>
            <tr>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-3 py-2.5 text-[12px] sm:text-[13px] font-medium text-[#475569] bg-[#F9FAFB] border-b border-[#E5E7EB] ${col.width}`}
                >
                  {col.label}
                </th>
              ))}
              {/* Narrow column for delete icon */}
              <th className="w-10 bg-[#F9FAFB] border-b border-[#E5E7EB]" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isFocused = focusedRowId === row.id;
              const isHovered = hoveredRowId === row.id;
              return (
                <tr
                  key={row.id}
                  className="group border-b border-[#E5E7EB] transition-colors"
                  onMouseEnter={() => setHoveredRowId(row.id)}
                  onMouseLeave={() => setHoveredRowId(null)}
                >
                  {COLUMNS.map((col, colIdx) => (
                    <td
                      key={col.key}
                      className={`border-r border-[#E5E7EB] h-[44px] p-0 relative ${
                        colIdx === 0 && isFocused
                          ? 'before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-[#4F46E5] before:rounded-r-sm'
                          : ''
                      }`}
                    >
                      {renderCell(row, col)}
                    </td>
                  ))}
                  <td className="h-[44px] p-0 w-10">
                    {(isHovered || true) && rows.length > 1 && (
                      <button
                        onClick={() => removeRow(row.id)}
                        className={`flex items-center justify-center w-full h-full text-[#94A3B8] hover:text-[#EF4444] transition-colors min-h-[44px] ${
                          isHovered ? 'opacity-100' : 'opacity-0 sm:opacity-0'
                        } group-hover:opacity-100`}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add row button */}
      <div className="flex justify-end p-3">
        <button
          onClick={addRow}
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#4F46E5] text-white hover:bg-[#4338CA] transition-colors shadow-sm active:scale-95 min-h-[44px] min-w-[44px]"
          title="Add row"
        >
          <Plus size={16} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export { emptyRow };
