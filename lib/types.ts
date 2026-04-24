/**
 * Shared types for the /api/ask response envelope and chart payloads.
 *
 * ChartPayload is a discriminated union that grows as more chart types are
 * wired. The dispatchers (lib/charts/map.ts, components/charts/
 * ChartRenderer.tsx) use exhaustiveness guards so adding a variant here is
 * a compile error until every branch handles it.
 */

export type ChartUnit = 'usd' | 'count' | 'pct';

export type BarHorizontalChart = {
  type: 'bar_horizontal';
  title: string;
  rows: Array<{ label: string; v: number }>;
  unit: ChartUnit;
};

export type LineChart = {
  type: 'line';
  title: string;
  points: Array<{ t: string; v: number }>;
  unit: ChartUnit;
};

export type EmptyChart = {
  type: 'empty';
  title: string;
  message: string;
};

export type ChartPayload = BarHorizontalChart | LineChart | EmptyChart;

export type AskStatus = 'ok' | 'out_of_scope' | 'empty' | 'unavailable_reason';

export type AskResponse = {
  status: AskStatus;
  text: string;
  chart: ChartPayload | null;
};

export type AskErrorResponse = {
  error: string;
  detail?: string;
};
