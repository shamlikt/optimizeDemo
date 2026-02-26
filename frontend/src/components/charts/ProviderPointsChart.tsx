import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { ManagerProviderPoints } from '../../types';

interface ProviderPointsChartProps {
  data: ManagerProviderPoints[];
  searchQuery: string;
}

interface ProviderRow {
  name: string;
  am_points: number;
  pm_points: number;
  total: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; payload?: ProviderRow }>;
  label?: string;
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
              backgroundColor: entry.dataKey === 'am_points' ? '#4338CA' : '#A5B4FC',
            }}
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

export function ProviderPointsChart({ data, searchQuery }: ProviderPointsChartProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const xTicks = [0, 20, 40, 60, 80, 100, 120, 140];

  return (
    <div
      className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      {/* Mobile Card View */}
      <div className="md:hidden">
        {data.map((managerGroup) => {
          const filteredProviders = managerGroup.providers.filter((p) =>
            p.provider.toLowerCase().includes(searchQuery.toLowerCase())
          );
          if (filteredProviders.length === 0) return null;

          return (
            <div key={managerGroup.manager_name}>
              {/* Manager header */}
              <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0">
                    {managerGroup.manager_name.charAt(0)}
                  </div>
                  <span className="text-[13px] font-bold text-[#1E293B] truncate">
                    {managerGroup.manager_name}
                  </span>
                </div>
              </div>
              {/* Provider cards */}
              {filteredProviders.map((provider) => (
                <div
                  key={`${managerGroup.manager_name}-${provider.provider}`}
                  className="px-4 py-3 border-b border-[#E2E8F0] last:border-b-0"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] text-[#475569] truncate">{provider.provider}</span>
                    <span className="text-[12px] font-semibold text-[#1E293B] shrink-0 ml-2">
                      {provider.total_points} pts
                    </span>
                  </div>
                  {/* Mini bar */}
                  <div className="flex items-center gap-1 h-4">
                    <div
                      className="h-full bg-[#4338CA] rounded-l"
                      style={{ width: `${Math.min((provider.am_points / 140) * 100, 100)}%` }}
                    />
                    <div
                      className="h-full bg-[#A5B4FC] rounded-r"
                      style={{ width: `${Math.min((provider.pm_points / 140) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-1.5 text-[10px] text-[#94A3B8]">
                    <span>AM: {provider.am_points}</span>
                    <span>PM: {provider.pm_points}</span>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        {/* Table header */}
        <div className="grid grid-cols-[200px_200px_1fr] border-b border-[#E2E8F0]">
          <div className="px-4 py-3 text-[13px] font-semibold text-[#475569] border-r border-[#E2E8F0]">
            Clinic Manager
          </div>
          <div className="px-4 py-3 text-[13px] font-semibold text-[#475569] border-r border-[#E2E8F0]">
            Provider - Split 1
          </div>
          <div className="px-4 py-3 text-[13px] font-semibold text-[#475569]">
            Visit Points
          </div>
        </div>

        {/* Data rows grouped by manager */}
        {data.map((managerGroup) => {
          const filteredProviders = managerGroup.providers.filter((p) =>
            p.provider.toLowerCase().includes(searchQuery.toLowerCase())
          );

          if (filteredProviders.length === 0) return null;

          const chartData: ProviderRow[] = filteredProviders.map((p) => ({
            name: p.provider,
            am_points: p.am_points,
            pm_points: p.pm_points,
            total: p.total_points,
          }));

          return (
            <div key={managerGroup.manager_name}>
              {filteredProviders.map((provider, provIdx) => {
                const rowKey = `${managerGroup.manager_name}-${provider.provider}`;
                const isHovered = hoveredRow === rowKey;
                const singleRowData = [chartData[provIdx]];

                return (
                  <div
                    key={rowKey}
                    className={`grid grid-cols-[200px_200px_1fr] border-b border-[#E2E8F0] last:border-b-0 transition-colors ${
                      isHovered ? 'bg-[#F8FAFC]' : ''
                    }`}
                    onMouseEnter={() => setHoveredRow(rowKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {/* Manager column - only show for first provider */}
                    <div className="px-4 py-3 border-r border-[#E2E8F0] flex items-center">
                      {provIdx === 0 && (
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-[12px] font-semibold flex-shrink-0">
                            {managerGroup.manager_name.charAt(0)}
                          </div>
                          <span className="text-[13px] font-bold text-[#1E293B] truncate">
                            {managerGroup.manager_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Provider name column */}
                    <div className="px-4 py-3 border-r border-[#E2E8F0] flex items-center">
                      <span className="text-[13px] text-[#475569] truncate">
                        {provider.provider}
                      </span>
                    </div>

                    {/* Horizontal bar chart */}
                    <div className="px-2 py-1 flex items-center">
                      <ResponsiveContainer width="100%" height={36}>
                        <BarChart
                          data={singleRowData}
                          layout="vertical"
                          barGap={0}
                          barSize={16}
                          margin={{ left: 0, right: 10, top: 2, bottom: 2 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#F1F5F9"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            domain={[0, 140]}
                            ticks={xTicks}
                            tick={{ fontSize: 9, fill: '#94A3B8', fontFamily: 'Inter, sans-serif' }}
                            tickLine={false}
                            axisLine={{ stroke: '#E2E8F0' }}
                            hide
                          />
                          <YAxis type="category" dataKey="name" hide />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar
                            dataKey="am_points"
                            stackId="stack"
                            fill="#4338CA"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="pm_points"
                            stackId="stack"
                            fill="#A5B4FC"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* X-axis labels at bottom */}
        <div className="grid grid-cols-[200px_200px_1fr] border-t border-[#E2E8F0]">
          <div className="border-r border-[#E2E8F0]" />
          <div className="border-r border-[#E2E8F0]" />
          <div className="px-2 py-2">
            <div className="flex justify-between text-[10px] text-[#94A3B8]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {xTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
