'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartPayload, ChartUnit } from '@/lib/types';

// Brand tokens referenced inline — these MUST match lib/types.ts ChartUnit and
// tailwind.config.ts's `brand` palette. No other colours permitted in charts.
const BRAND_PRIMARY = '#008080'; // Deep Teal — primary series only
const BRAND_HAIRLINE = '#E5E7EB'; // card / axis hairline
const BRAND_MUTED = '#6C7570'; // Cool Gray — axes, ticks, secondary labels
const BRAND_BG_APP = '#F8F9FA'; // Off-White — used here as tooltip hover cursor

function formatValue(v: number, unit: ChartUnit): string {
  if (unit === 'usd') {
    return v.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    });
  }
  if (unit === 'pct') {
    return `${v.toFixed(1)}%`;
  }
  return v.toLocaleString('en-US');
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="border border-brand-hairline rounded-token bg-brand-bgSurface p-4"
      style={{ boxShadow: 'var(--shadow)' }}
    >
      <p className="text-sm font-medium text-brand-textPrimary mb-3">{title}</p>
      {children}
    </div>
  );
}

function BarHorizontal({
  chart,
}: {
  chart: Extract<ChartPayload, { type: 'bar_horizontal' }>;
}) {
  const data = chart.rows.map((r) => ({ label: r.label, v: r.v }));
  // Recharts calls a bars-on-X-axis chart `layout="vertical"` — confusing but
  // correct; the category axis is Y and the value axis is X.
  const rowHeight = 32;
  const chartHeight = Math.max(180, data.length * rowHeight + 48);
  return (
    <Card title={chart.title}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 0, bottom: 4 }}
        >
          <CartesianGrid horizontal={false} stroke={BRAND_HAIRLINE} />
          <XAxis
            type="number"
            tickFormatter={(v: number) => formatValue(v, chart.unit)}
            stroke={BRAND_MUTED}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={160}
            stroke={BRAND_MUTED}
            fontSize={12}
          />
          <Tooltip
            formatter={(value) => {
              const v = typeof value === 'number' ? value : Number(value);
              return [formatValue(v, chart.unit), ''];
            }}
            cursor={{ fill: BRAND_BG_APP }}
            contentStyle={{
              border: `1px solid ${BRAND_HAIRLINE}`,
              borderRadius: 4,
              fontSize: 12,
            }}
            labelStyle={{ color: BRAND_MUTED }}
          />
          <Bar dataKey="v" fill={BRAND_PRIMARY} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

function EmptyState({
  chart,
}: {
  chart: Extract<ChartPayload, { type: 'empty' }>;
}) {
  return (
    <Card title={chart.title}>
      <p className="text-sm text-brand-textMuted py-6 text-center">
        {chart.message}
      </p>
    </Card>
  );
}

export function ChartRenderer({ chart }: { chart: ChartPayload }) {
  if (chart.type === 'bar_horizontal') return <BarHorizontal chart={chart} />;
  if (chart.type === 'empty') return <EmptyState chart={chart} />;
  // Exhaustiveness guard for future ChartPayload variants.
  const _exhaustive: never = chart;
  void _exhaustive;
  return null;
}
