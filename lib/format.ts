import type { ChartUnit } from '@/lib/types';

// ---------------------------------------------------------------------------
// Shared number formatters — single source of truth for both server text
// templates (lib/text/answer.ts) and client chart rendering
// (components/charts/ChartRenderer.tsx).
//
// Implementations are byte-identical to the previous inline versions in
// those two files, so extracting this module introduces zero behavior drift.
// ---------------------------------------------------------------------------

export function formatUsd(v: number): string {
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

export function formatCount(v: number): string {
  return v.toLocaleString('en-US');
}

export function formatPct(v: number): string {
  return `${v.toFixed(1)}%`;
}

export function formatByUnit(v: number, unit: ChartUnit): string {
  if (unit === 'usd') return formatUsd(v);
  if (unit === 'pct') return formatPct(v);
  return formatCount(v);
}
