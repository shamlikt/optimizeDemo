import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import type { TechPointsEntry } from '../../types';

interface MonthlyTechPointsChartProps {
  data: TechPointsEntry;
  target: number;
  locationName?: string;
  clinicManager?: string;
}

interface ChartDataPoint {
  date: string;
  dateFormatted: string;
  fullDate: string;
  day_of_week: string;
  am_points: number;
  pm_points: number;
  total_points: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload?: ChartDataPoint }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg px-3 py-2"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <p className="text-[12px] font-medium text-[#1E293B] mb-1.5">
        {item?.fullDate || label}
      </p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-[11px] mb-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{
              backgroundColor: entry.dataKey === 'am_points' ? '#0D9488' : '#5EEAD4',
            }}
          />
          <span className="text-[#475569]">
            {entry.dataKey === 'am_points' ? 'AM' : 'PM'}:
          </span>
          <span className="font-medium text-[#1E293B]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyTechPointsChart({
  data,
  target,
  locationName,
  clinicManager,
}: MonthlyTechPointsChartProps) {
  const chartData: ChartDataPoint[] = data.daily_points.map((d) => {
    const parsed = parseISO(d.date);
    return {
      ...d,
      dateFormatted: format(parsed, 'MM/dd/yyyy'),
      fullDate: format(parsed, 'MMM dd, yyyy'),
    };
  });

  const maxVal = Math.max(
    ...chartData.map((d) => d.am_points + d.pm_points),
    target + 5,
    30
  );
  const yTicks = [];
  for (let i = 0; i <= maxVal; i += 10) {
    yTicks.push(i);
  }

  const percentChange = '0.20%';

  return (
    <div className="w-full">
      {/* Per-tech row */}
      <div className="flex flex-col sm:flex-row sm:items-stretch border-b border-[#E2E8F0] py-5">
        {/* Left info panel */}
        <div className="flex-shrink-0 pr-6 mb-4 sm:mb-0 sm:w-[180px]">
          <p
            className="text-[12px] text-[#94A3B8] mb-0.5"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Tech type
          </p>
          <div className="flex items-center gap-1.5 mb-2">
            <h4
              className="text-[16px] font-bold text-[#1E293B]"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {data.rooming_tech}
            </h4>
            <ArrowUpRight size={14} className="text-[#10B981]" />
            <span
              className="text-[12px] text-[#10B981] font-medium"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {percentChange}
            </span>
          </div>
          <p
            className="text-[12px] text-[#94A3B8] mb-0.5"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Location
          </p>
          <p
            className="text-[14px] font-bold text-[#1E293B]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {locationName || 'Location 1'}
          </p>
          {clinicManager && (
            <p className="text-[12px] text-[#94A3B8] mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
              Manager: {clinicManager}
            </p>
          )}
        </div>

        {/* Right: Stacked bar chart with teal colors */}
        <div className="flex-1 min-w-0">
          <div className="h-[200px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={0} barSize={14}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#E2E8F0"
                  vertical={false}
                />
                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fontSize: 9, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E2E8F0' }}
                  angle={-60}
                  textAnchor="end"
                  height={65}
                  interval={0}
                />
                <YAxis
                  domain={[0, Math.ceil(maxVal / 10) * 10]}
                  ticks={yTicks}
                  tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: 'Visit Points',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -5,
                    style: { fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' },
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={target}
                  stroke="#EF4444"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Target: ${target}`,
                    position: 'right',
                    fill: '#EF4444',
                    fontSize: 10,
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
                <Bar dataKey="am_points" stackId="stack" fill="#0D9488" radius={[0, 0, 0, 0]}>
                  <LabelList
                    dataKey="am_points"
                    position="center"
                    style={{
                      fontSize: 8,
                      fill: '#fff',
                      fontWeight: 600,
                      fontFamily: 'Inter, sans-serif',
                    }}
                    formatter={(val: unknown) => (Number(val) > 0 ? Number(val) : '')}
                  />
                </Bar>
                <Bar dataKey="pm_points" stackId="stack" fill="#5EEAD4" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="pm_points"
                    position="top"
                    style={{
                      fontSize: 8,
                      fill: '#475569',
                      fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                    }}
                    formatter={(val: unknown) => (Number(val) > 0 ? Number(val) : '')}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
