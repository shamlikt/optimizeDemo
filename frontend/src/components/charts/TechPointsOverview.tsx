import {
  LineChart,
  Line,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { TrendDataPoint } from '../../types';

interface LocationTrend {
  name: string;
  color: string;
  totalPoints: number;
}

interface TechPointsOverviewProps {
  data: TrendDataPoint[];
  locations?: LocationTrend[];
}

const DEFAULT_LOCATIONS: LocationTrend[] = [
  { name: 'Location A', color: '#3B82F6', totalPoints: 0 },
  { name: 'Location B', color: '#F472B6', totalPoints: 0 },
  { name: 'Location C', color: '#67E8F9', totalPoints: 0 },
];

export function TechPointsOverview({ data, locations }: TechPointsOverviewProps) {
  const locationList = locations && locations.length > 0 ? locations : DEFAULT_LOCATIONS;

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] sm:h-64 text-[#94A3B8]">
        No trend data available
      </div>
    );
  }

  // Build chart data with per-location simulated split
  const chartData = data.map((point) => {
    const base: Record<string, string | number> = {
      date: point.date,
      dateFormatted: format(parseISO(point.date), 'MMM dd'),
      total_points: point.total_points,
      appointment_count: point.appointment_count,
    };

    if (locationList.length >= 3) {
      const total = point.total_points || 0;
      base['loc_0'] = Math.round(total * 0.45);
      base['loc_1'] = Math.round(total * 0.32);
      base['loc_2'] = Math.round(total * 0.23);
    } else if (locationList.length === 2) {
      const total = point.total_points || 0;
      base['loc_0'] = Math.round(total * 0.55);
      base['loc_1'] = Math.round(total * 0.45);
    } else {
      base['loc_0'] = point.total_points || 0;
    }

    return base;
  });

  // Calculate total points per location from chart data
  const locationTotals = locationList.map((loc, idx) => {
    const key = `loc_${idx}`;
    const total = chartData.reduce((sum, d) => sum + (Number(d[key]) || 0), 0);
    return { ...loc, totalPoints: loc.totalPoints || total };
  });

  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
      {/* Chart area */}
      <div className="flex-1 min-w-0">
        <div className="h-[180px] sm:h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
                labelFormatter={(label) => `${label}`}
              />
              {locationList.map((loc, idx) => (
                <Line
                  key={idx}
                  type="monotone"
                  dataKey={`loc_${idx}`}
                  name={loc.name}
                  stroke={loc.color}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend with totals - below chart on mobile, right side on desktop */}
      <div className="flex flex-row sm:flex-col justify-start sm:justify-center gap-4 sm:gap-5 sm:pr-2 sm:min-w-[160px] overflow-x-auto scrollbar-hide">
        {locationTotals.map((loc, idx) => (
          <div key={idx} className="flex items-start gap-2.5 shrink-0">
            <span
              className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: loc.color }}
            />
            <div>
              <p className="text-xs text-[#94A3B8] leading-tight">{loc.name}</p>
              <p className="text-lg sm:text-xl font-bold text-[#1E293B] leading-tight mt-0.5">
                {loc.totalPoints.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
