import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { format, parseISO, isToday } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';
import type { TechPointsEntry } from '../../types';

interface TechPointsBarChartProps {
  data: TechPointsEntry;
  target: number;
  locationName?: string;
}

interface ChartDataPoint {
  date: string;
  dateFormatted: string;
  day_of_week: string;
  am_points: number;
  pm_points: number;
  total_points: number;
  isToday: boolean;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-white border border-[#F3F4F6] rounded-lg shadow-lg px-3 py-2">
      <p className="text-[12px] font-medium text-[#1E293B] mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-[11px]">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-[#475569]">
            {entry.dataKey === 'am_points' ? 'Morning' : 'Afternoon'}:
          </span>
          <span className="font-medium text-[#1E293B]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function TechPointsBarChart({ data, target, locationName }: TechPointsBarChartProps) {
  const chartData: ChartDataPoint[] = data.daily_points.map((d) => {
    const parsed = parseISO(d.date);
    return {
      ...d,
      dateFormatted: format(parsed, 'MM/dd/yyyy'),
      isToday: isToday(parsed),
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
      <div className="flex flex-col sm:flex-row sm:items-stretch border-b border-[#F3F4F6] py-5">
        {/* Left info panel */}
        <div className="flex-shrink-0 pr-6 mb-4 sm:mb-0 sm:w-[180px]">
          <p className="text-[12px] text-[#94A3B8] mb-0.5">
            Tech type
          </p>
          <div className="flex items-center gap-1.5 mb-2">
            <h4 className="text-[16px] font-bold text-[#1E293B]">
              {data.rooming_tech}
            </h4>
            <ArrowUpRight size={14} className="text-[#10B981]" />
            <span className="text-[12px] text-[#10B981] font-medium">
              {percentChange}
            </span>
          </div>
          <p className="text-[12px] text-[#94A3B8] mb-0.5">
            Location
          </p>
          <p className="text-[14px] font-bold text-[#1E293B]">
            {locationName || 'Location 1'}
          </p>
        </div>

        {/* Right: Stacked bar chart */}
        <div className="flex-1 min-w-0">
          <div className="h-[200px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={0} barSize={20}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#F3F4F6"
                  vertical={false}
                />
                <XAxis
                  dataKey="dateFormatted"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={{ stroke: '#F3F4F6' }}
                  angle={-60}
                  textAnchor="end"
                  height={65}
                  interval={0}
                />
                <YAxis
                  domain={[0, Math.ceil(maxVal / 10) * 10]}
                  ticks={yTicks}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  label={{
                    value: 'Visit Points',
                    angle: -90,
                    position: 'insideLeft',
                    offset: -5,
                    style: { fontSize: 11, fill: '#94A3B8' },
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
                  }}
                />
                <Bar dataKey="am_points" stackId="stack" radius={[0, 0, 0, 0]}>
                  <LabelList
                    dataKey="am_points"
                    position="center"
                    style={{
                      fontSize: 9,
                      fill: '#fff',
                      fontWeight: 600,
                    }}
                    formatter={(val: unknown) => (Number(val) > 0 ? Number(val) : '')}
                  />
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`am-${index}`}
                      fill="#4338CA"
                      opacity={entry.isToday ? 1 : 0.95}
                    />
                  ))}
                </Bar>
                <Bar dataKey="pm_points" stackId="stack" radius={[4, 4, 0, 0]}>
                  <LabelList
                    dataKey="pm_points"
                    position="top"
                    style={{
                      fontSize: 9,
                      fill: '#475569',
                      fontWeight: 500,
                    }}
                    formatter={(val: unknown) => (Number(val) > 0 ? Number(val) : '')}
                  />
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`pm-${index}`}
                      fill="#A5B4FC"
                      opacity={entry.isToday ? 1 : 0.95}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
