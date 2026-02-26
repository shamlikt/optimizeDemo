import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { WeeklyLocationEntry, DailyPoints } from '../../types';

interface WeeklyPointsGridProps {
  data: WeeklyLocationEntry[];
}

interface MiniBarData {
  name: string;
  am: number;
  pm: number;
  total: number;
}

function CellTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload?: MiniBarData }>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg px-3 py-2"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="flex items-center gap-2 text-[11px] mb-0.5">
        <span className="inline-block w-2 h-2 rounded-full bg-[#4338CA]" />
        <span className="text-[#475569]">AM:</span>
        <span className="font-semibold text-[#4338CA] bg-[#EEF2FF] px-1.5 py-0.5 rounded text-[10px]">
          {item.am}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px] mb-0.5">
        <span className="inline-block w-2 h-2 rounded-full bg-[#A5B4FC]" />
        <span className="text-[#475569]">PM:</span>
        <span className="font-semibold text-[#6366F1] bg-[#EEF2FF] px-1.5 py-0.5 rounded text-[10px]">
          {item.pm}
        </span>
      </div>
      <div className="flex items-center gap-2 text-[11px]">
        <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]" />
        <span className="text-[#475569]">Total:</span>
        <span className="font-semibold text-[#10B981] bg-[#ECFDF5] px-1.5 py-0.5 rounded text-[10px]">
          {item.total}
        </span>
      </div>
    </div>
  );
}

function formatDayHeader(dayData: DailyPoints): string {
  try {
    const parsed = parseISO(dayData.date);
    return format(parsed, "EEEE, MMM dd, yyyy");
  } catch {
    return dayData.day_of_week;
  }
}

function formatDayHeaderShort(dayData: DailyPoints): string {
  try {
    const parsed = parseISO(dayData.date);
    return format(parsed, "EEE, MMM dd");
  } catch {
    return dayData.day_of_week;
  }
}

export function WeeklyPointsGrid({ data }: WeeklyPointsGridProps) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-8 text-center">
        <p className="text-[#94A3B8]" style={{ fontFamily: 'Inter, sans-serif' }}>
          No weekly data available
        </p>
      </div>
    );
  }

  // Get day labels from first entry
  const dayEntries = data[0]?.daily_points || [];
  const numDays = dayEntries.length || 5;

  // Calculate max for consistent scale across all mini charts
  const allPoints = data.flatMap((row) =>
    row.daily_points.map((d) => Math.max(d.am_points, d.pm_points, d.total_points))
  );
  const maxPoint = Math.max(...allPoints, 200);
  const xAxisTicks = [0, 100, 200];

  return (
    <div
      className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Horizontal scroll wrapper */}
      <div className="overflow-x-auto scroll-snap-x snap-mandatory">
        <div style={{ minWidth: `${160 + numDays * 180}px` }}>
          {/* Header row with day names */}
          <div
            className="grid border-b border-[#E2E8F0]"
            style={{ gridTemplateColumns: `160px repeat(${numDays}, 1fr)` }}
          >
            <div className="px-3 sm:px-4 py-3 text-[12px] sm:text-[13px] font-semibold text-[#475569] border-r border-[#E2E8F0] sticky left-0 bg-white z-10">
              Department/HCA
            </div>
            {dayEntries.map((dayData, idx) => (
              <div
                key={idx}
                className="px-2 sm:px-3 py-3 text-[11px] sm:text-[12px] font-medium text-[#475569] text-center border-r border-[#E2E8F0] last:border-r-0 snap-start"
              >
                <span className="hidden sm:inline">{formatDayHeader(dayData)}</span>
                <span className="sm:hidden">{formatDayHeaderShort(dayData)}</span>
              </div>
            ))}
          </div>

          {/* Data rows */}
          {data.map((row, rowIdx) => {
            const isHovered = hoveredRow === rowIdx;

            return (
              <div
                key={rowIdx}
                className={`grid border-b border-[#E2E8F0] last:border-b-0 transition-colors ${
                  isHovered ? 'bg-[#F8FAFC]' : ''
                }`}
                style={{ gridTemplateColumns: `160px repeat(${numDays}, 1fr)` }}
                onMouseEnter={() => setHoveredRow(rowIdx)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Location name - sticky first column */}
                <div className="px-3 sm:px-4 py-3 border-r border-[#E2E8F0] flex items-center sticky left-0 bg-white z-10">
                  <p className="text-[12px] sm:text-[13px] font-medium text-[#1E293B] truncate">
                    {row.location_name}
                  </p>
                </div>

                {/* Day cells with 3 mini horizontal bars */}
                {row.daily_points.map((dayData, dayIdx) => {
                  const barsData: MiniBarData[] = [
                    {
                      name: 'AM',
                      am: dayData.am_points,
                      pm: 0,
                      total: 0,
                    },
                    {
                      name: 'PM',
                      am: 0,
                      pm: dayData.pm_points,
                      total: 0,
                    },
                    {
                      name: 'Total',
                      am: 0,
                      pm: 0,
                      total: dayData.total_points,
                    },
                  ];

                  const hasData = dayData.total_points > 0;

                  return (
                    <div
                      key={dayIdx}
                      className="px-2 py-2 border-r border-[#E2E8F0] last:border-r-0 flex items-center justify-center snap-start"
                    >
                      {hasData ? (
                        <ResponsiveContainer width="100%" height={56}>
                          <BarChart
                            data={barsData}
                            layout="vertical"
                            barSize={10}
                            margin={{ left: 0, right: 4, top: 2, bottom: 2 }}
                          >
                            <XAxis
                              type="number"
                              domain={[0, maxPoint]}
                              hide
                            />
                            <YAxis type="category" dataKey="name" hide />
                            <Tooltip
                              content={<CellTooltip />}
                              cursor={false}
                            />
                            <Bar dataKey="am" fill="#4338CA" radius={[0, 3, 3, 0]} />
                            <Bar dataKey="pm" fill="#A5B4FC" radius={[0, 3, 3, 0]} />
                            <Bar dataKey="total" fill="#7C3AED" radius={[0, 3, 3, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <span className="text-[12px] text-[#CBD5E1]">--</span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Bottom x-axis labels */}
          <div
            className="grid border-t border-[#E2E8F0]"
            style={{ gridTemplateColumns: `160px repeat(${numDays}, 1fr)` }}
          >
            <div className="border-r border-[#E2E8F0] sticky left-0 bg-white z-10" />
            {dayEntries.map((_, idx) => (
              <div
                key={idx}
                className="px-2 py-1.5 border-r border-[#E2E8F0] last:border-r-0"
              >
                <div className="flex justify-between text-[9px] text-[#94A3B8]">
                  {xAxisTicks.map((tick) => (
                    <span key={tick}>{tick}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Visit Points label */}
          <div className="py-2 text-center">
            <span className="text-[12px] text-[#94A3B8]">Visit Points</span>
          </div>
        </div>
      </div>
    </div>
  );
}
