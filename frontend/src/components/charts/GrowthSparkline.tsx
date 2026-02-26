import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';

interface GrowthSparklineProps {
  data?: number[];
  color?: string;
  height?: number;
  labels?: string[];
}

export function GrowthSparkline({
  data = [30, 45, 38, 52, 48, 65, 72, 68, 80, 75, 85, 92],
  color = '#6366F1',
  height = 80,
  labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
}: GrowthSparklineProps) {
  const chartData = data.map((value, index) => ({
    index,
    value,
    label: labels[index] || '',
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`growth-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: '#94A3B8' }}
          tickLine={false}
          axisLine={false}
          interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#growth-gradient-${color.replace('#', '')})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
