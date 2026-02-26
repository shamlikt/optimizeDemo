import { useState, useRef, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { FTEDataEntry } from '../../types';

interface FTEComparisonChartProps {
  data: FTEDataEntry[];
  month1Label: string;
  month2Label: string;
}

interface ChartRow {
  name: string;
  month1: number;
  month2: number;
}

function CustomTooltip({
  active,
  payload,
  month1Label,
  month2Label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload?: ChartRow }>;
  label?: string;
  month1Label: string;
  month2Label: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const item = payload[0]?.payload;
  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-lg shadow-lg px-3 py-2"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <p className="text-[12px] font-medium text-[#1E293B] mb-1">{item?.name}</p>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-[11px] mb-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{
              backgroundColor: entry.dataKey === 'month1' ? '#4338CA' : '#0D9488',
            }}
          />
          <span className="text-[#475569]">
            {entry.dataKey === 'month1' ? month1Label : month2Label}:
          </span>
          <span className="font-medium text-[#1E293B]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function FTEComparisonChart({ data, month1Label, month2Label }: FTEComparisonChartProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState(false);

  // ResizeObserver to detect narrow containers
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setIsNarrow(entry.contentRect.width < 500);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chartData: ChartRow[] = data.map((d) => ({
    name: d.specialty || d.location_name,
    month1: d.month1_points,
    month2: d.month2_points,
  }));

  const xTicks = [0, 100, 200, 300, 400, 500, 600, 700];
  const chartHeight = Math.max(data.length * 52, 200);
  const yAxisWidth = isNarrow ? 100 : 160;

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-xl border border-[#E2E8F0] p-4 sm:p-5"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Column title label */}
      <p className="text-[12px] text-[#94A3B8] mb-3">Column title</p>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          barGap={4}
          barSize={14}
          margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
          onMouseMove={(state: Record<string, unknown>) => {
            const ap = state?.activePayload as Array<{ payload: { name: string } }> | undefined;
            if (ap?.[0]?.payload) {
              setHoveredRow(ap[0].payload.name);
            }
          }}
          onMouseLeave={() => setHoveredRow(null)}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#F1F5F9"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 700]}
            ticks={xTicks}
            tick={{ fontSize: 11, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
            tickLine={false}
            axisLine={{ stroke: '#E2E8F0' }}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={yAxisWidth}
            tick={(props: Record<string, unknown>) => {
              const { x, y, payload } = props as { x: number; y: number; payload: { value: string } };
              const isHovered = hoveredRow === payload.value;
              const label = isNarrow && payload.value.length > 12
                ? payload.value.slice(0, 12) + '...'
                : payload.value;
              return (
                <text
                  x={x}
                  y={y}
                  dy={4}
                  textAnchor="end"
                  style={{
                    fontSize: isNarrow ? 10 : 12,
                    fill: isHovered ? '#1E293B' : '#475569',
                    fontWeight: isHovered ? 600 : 400,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {label}
                </text>
              );
            }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={<CustomTooltip month1Label={month1Label} month2Label={month2Label} />}
            cursor={{ fill: '#F8FAFC' }}
          />
          <Bar
            dataKey="month1"
            fill="#4338CA"
            radius={[0, 4, 4, 0]}
            name={month1Label}
          />
          <Bar
            dataKey="month2"
            fill="#0D9488"
            radius={[0, 4, 4, 0]}
            name={month2Label}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
