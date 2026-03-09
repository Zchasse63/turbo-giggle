import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const TIER_COLORS: Record<number, string> = {
  0: '#2BBCCD',
  1: '#E8A838',
  2: '#E8A838',
  3: '#e67e22',
  4: '#e67e22',
  5: '#e67e22',
  6: '#e74c3c',
  7: '#e74c3c',
  8: '#e74c3c',
  9: '#e74c3c',
};

interface TierChartProps {
  data: Array<{ tier: number; label: string; count: number; ltv: number }>;
  mode: 'count' | 'revenue';
}

function formatDollars(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface TooltipPayloadItem {
  payload: { tier: number; label: string; count: number; ltv: number };
}

function CustomTooltip({
  active,
  payload,
  currentMode,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  currentMode: 'count' | 'revenue';
}) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-white px-4 py-3 shadow-lg border border-gray-100">
      <p className="text-sm font-semibold text-gray-900">
        Tier {d.tier}: {d.label}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Members: <span className="font-mono font-medium text-gray-900">{d.count.toLocaleString()}</span>
      </p>
      <p className="text-xs text-gray-500">
        Revenue: <span className="font-mono font-medium text-gray-900">{formatDollars(d.ltv)}</span>
      </p>
      {currentMode === 'count' && (
        <p className="text-[10px] text-gray-400 mt-1">Showing member count</p>
      )}
      {currentMode === 'revenue' && (
        <p className="text-[10px] text-gray-400 mt-1">Showing total revenue</p>
      )}
    </div>
  );
}

export default function TierChart({ data, mode: initialMode }: TierChartProps) {
  const [mode, setMode] = useState<'count' | 'revenue'>(initialMode);

  const dataKey = mode === 'count' ? 'count' : 'ltv';

  const chartData = data.map((d) => ({
    ...d,
    displayLabel: `T${d.tier} ${d.label}`,
  }));

  const formatTick = (value: number) => {
    if (mode === 'revenue') {
      if (value >= 100_00) {
        return `$${(value / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
      }
      return `$${(value / 100).toFixed(0)}`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3
          className="text-lg font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Members by Tier
        </h3>
        <div className="flex rounded-lg bg-gray-100 p-0.5">
          <button
            onClick={() => setMode('count')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'count'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Count
          </button>
          <button
            onClick={() => setMode('revenue')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              mode === 'revenue'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Revenue
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tickFormatter={formatTick}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="displayLabel"
            width={160}
            tick={{ fontSize: 12, fill: '#374151' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            content={<CustomTooltip currentMode={mode} />}
            cursor={{ fill: 'rgba(0,0,0,0.04)' }}
          />
          <Bar dataKey={dataKey} radius={[0, 6, 6, 0]} barSize={28}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={TIER_COLORS[entry.tier] || '#9ca3af'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
