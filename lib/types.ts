/**
 * Shared types for the /api/ask response envelope and chart payloads.
 *
 * ChartPayload is a discriminated union that will grow as more chart types
 * are wired. This slice defines only the two variants that the one-tool
 * slice emits: `bar_horizontal` (top_products result) and `empty` (no rows).
 */

export type ChartUnit = 'usd' | 'count' | 'pct';

export type BarHorizontalChart = {
  type: 'bar_horizontal';
  title: string;
  rows: Array<{ label: string; v: number }>;
  unit: ChartUnit;
};

export type EmptyChart = {
  type: 'empty';
  title: string;
  message: string;
};

export type ChartPayload = BarHorizontalChart | EmptyChart;

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
