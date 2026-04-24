'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatByUnit } from '@/lib/format';
import type { ChartPayload } from '@/lib/types';

// Brand tokens referenced inline — these MUST match lib/types.ts ChartUnit and
// tailwind.config.ts's `brand` palette. No other colours permitted in charts.
const BRAND_PRIMARY = '#008080'; // Deep Teal — primary series only
const BRAND_HAIRLINE = '#E5E7EB'; // card / axis hairline
const BRAND_MUTED = '#6C7570'; // Cool Gray — axes, ticks, secondary labels
const BRAND_BG_APP = '#F8F9FA'; // Off-White — used here as tooltip hover cursor

// Pie palette — teal tints/shades derived from BRAND_PRIMARY. Index 0 is the
// primary; later indices are alternating lighter/darker variants. Lime is
// deliberately excluded — it is reserved for AI indicators, never data.
const PIE_PALETTE = [
  '#008080', // Deep Teal (primary)
  '#33A3A3', // lighter tint
  '#005F5F', // darker shade
  '#66BFBF', // much lighter
  '#003D3D', // much darker
  '#99DFDF', // very light
];

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
            tickFormatter={(v: number) => formatByUnit(v, chart.unit)}
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
              return [formatByUnit(v, chart.unit), ''];
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

function LineSeries({
  chart,
}: {
  chart: Extract<ChartPayload, { type: 'line' }>;
}) {
  const data = chart.points.map((p) => ({ t: p.t, v: p.v }));
  // Fixed height keeps visual weight consistent regardless of point count.
  const chartHeight = 240;
  return (
    <Card title={chart.title}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart
          data={data}
          margin={{ top: 8, right: 24, left: 4, bottom: 4 }}
        >
          <CartesianGrid stroke={BRAND_HAIRLINE} strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            stroke={BRAND_MUTED}
            fontSize={11}
            tickMargin={6}
            minTickGap={24}
          />
          <YAxis
            stroke={BRAND_MUTED}
            fontSize={11}
            tickFormatter={(v: number) => formatByUnit(v, chart.unit)}
            width={72}
          />
          <Tooltip
            formatter={(value) => {
              const v = typeof value === 'number' ? value : Number(value);
              return [formatByUnit(v, chart.unit), ''];
            }}
            cursor={{ stroke: BRAND_HAIRLINE, strokeWidth: 1 }}
            contentStyle={{
              border: `1px solid ${BRAND_HAIRLINE}`,
              borderRadius: 4,
              fontSize: 12,
            }}
            labelStyle={{ color: BRAND_MUTED }}
          />
          <Line
            type="monotone"
            dataKey="v"
            stroke={BRAND_PRIMARY}
            strokeWidth={2}
            dot={{ r: 3, stroke: BRAND_PRIMARY, fill: BRAND_PRIMARY }}
            activeDot={{ r: 5, stroke: BRAND_PRIMARY, fill: BRAND_PRIMARY }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

function Kpi({
  chart,
}: {
  chart: Extract<ChartPayload, { type: 'kpi' }>;
}) {
  return (
    <Card title={chart.title}>
      <p className="text-4xl font-mono text-brand-textPrimary py-6 text-center tracking-tight">
        {formatByUnit(chart.value, chart.unit)}
      </p>
    </Card>
  );
}

function PieDiagram({
  chart,
}: {
  chart: Extract<ChartPayload, { type: 'pie' }>;
}) {
  const data = chart.slices.map((s) => ({ label: s.label, v: s.v }));
  const chartHeight = 260;
  return (
    <Card title={chart.title}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart>
          <Pie
            data={data}
            dataKey="v"
            nameKey="label"
            cx="50%"
            cy="45%"
            outerRadius={80}
            innerRadius={0}
            stroke={BRAND_HAIRLINE}
            strokeWidth={1}
            isAnimationActive={false}
            label={false}
          >
            {data.map((_, i) => (
              <Cell
                key={i}
                fill={PIE_PALETTE[i % PIE_PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const v = typeof value === 'number' ? value : Number(value);
              return [formatByUnit(v, chart.unit), String(name)];
            }}
            contentStyle={{
              border: `1px solid ${BRAND_HAIRLINE}`,
              borderRadius: 4,
              fontSize: 12,
            }}
            labelStyle={{ color: BRAND_MUTED }}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="square"
            wrapperStyle={{ fontSize: 12, color: BRAND_MUTED }}
          />
        </PieChart>
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
  if (chart.type === 'line') return <LineSeries chart={chart} />;
  if (chart.type === 'kpi') return <Kpi chart={chart} />;
  if (chart.type === 'pie') return <PieDiagram chart={chart} />;
  if (chart.type === 'empty') return <EmptyState chart={chart} />;
  // Exhaustiveness guard for future ChartPayload variants.
  const _exhaustive: never = chart;
  void _exhaustive;
  return null;
}
