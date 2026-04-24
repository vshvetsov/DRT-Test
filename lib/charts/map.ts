import {
  getSimpleTotalValue,
  type RankedProductsArgs,
  type RankedProductsRow,
  type SalesOverTimeArgs,
  type SalesOverTimeRow,
  type SimpleTotalArgs,
  type SimpleTotalRow,
  type ToolResult,
} from '@/lib/tools';
import type { ChartPayload } from '@/lib/types';

// ---------------------------------------------------------------------------
// Ranked-product helpers (top / bottom share these).
// ---------------------------------------------------------------------------

function metricLabel(metric: 'revenue' | 'orders' | 'units'): string {
  if (metric === 'revenue') return 'revenue';
  if (metric === 'orders') return 'orders';
  return 'units sold';
}

function describeRangeOptional(
  date_from?: string,
  date_to?: string,
): string {
  if (date_from && date_to) return `${date_from} to ${date_to}`;
  if (date_from) return `from ${date_from}`;
  if (date_to) return `through ${date_to}`;
  return '';
}

function rankedTitle(
  args: RankedProductsArgs,
  direction: 'top' | 'bottom',
): string {
  const prefix = direction === 'top' ? 'Top' : 'Bottom';
  const range = describeRangeOptional(args.date_from, args.date_to);
  return `${prefix} ${args.limit} products by ${metricLabel(args.metric)}${range ? ` · ${range}` : ''}`;
}

function chartForRankedProducts(
  rows: RankedProductsRow[],
  args: RankedProductsArgs,
  direction: 'top' | 'bottom',
): ChartPayload {
  const title = rankedTitle(args, direction);
  if (rows.length === 0) {
    return {
      type: 'empty',
      title,
      message: 'No product sales in this range.',
    };
  }
  return {
    type: 'bar_horizontal',
    title,
    rows: rows.map((r) => ({
      label: r.product_name,
      v: args.metric === 'revenue' ? r.revenue : r.units,
    })),
    unit: args.metric === 'revenue' ? 'usd' : 'count',
  };
}

// ---------------------------------------------------------------------------
// sales_over_time helper — emits `line` or `empty`.
// ---------------------------------------------------------------------------

function salesOverTimeTitle(args: SalesOverTimeArgs): string {
  return `${metricLabel(args.metric)} by ${args.bucket} · ${args.date_from} to ${args.date_to}`;
}

function chartForSalesOverTime(
  rows: SalesOverTimeRow[],
  args: SalesOverTimeArgs,
): ChartPayload {
  const title = capitalize(salesOverTimeTitle(args));
  if (rows.length === 0) {
    return {
      type: 'empty',
      title,
      message: 'No sales in this range.',
    };
  }
  return {
    type: 'line',
    title,
    points: rows.map((r) => ({
      t: r.bucket_start,
      v: args.metric === 'revenue' ? r.revenue : r.units,
    })),
    unit: args.metric === 'revenue' ? 'usd' : 'count',
  };
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

// ---------------------------------------------------------------------------
// simple_total helper — emits `kpi` or `empty`. Empty only reached when the
// tool already returned [] (its chosen metric was zero or null).
// ---------------------------------------------------------------------------

function simpleTotalTitle(args: SimpleTotalArgs): string {
  return `Total ${metricLabel(args.metric)} · ${args.date_from} to ${args.date_to}`;
}

function chartForSimpleTotal(
  rows: SimpleTotalRow[],
  args: SimpleTotalArgs,
): ChartPayload {
  const title = simpleTotalTitle(args);
  const row = rows[0];
  if (!row) {
    return {
      type: 'empty',
      title,
      message: 'No sales in this range.',
    };
  }
  const value = getSimpleTotalValue(row, args.metric);
  return {
    type: 'kpi',
    title,
    value,
    unit: args.metric === 'revenue' ? 'usd' : 'count',
  };
}

// ---------------------------------------------------------------------------
// chartForResult — the single entry point. Discriminates on toolName so any
// future tool must add a branch or the TypeScript never-check fails.
// ---------------------------------------------------------------------------

export function chartForResult(result: ToolResult): ChartPayload {
  switch (result.toolName) {
    case 'top_products':
      return chartForRankedProducts(result.rows, result.args, 'top');
    case 'bottom_products':
      return chartForRankedProducts(result.rows, result.args, 'bottom');
    case 'sales_over_time':
      return chartForSalesOverTime(result.rows, result.args);
    case 'simple_total':
      return chartForSimpleTotal(result.rows, result.args);
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      throw new Error('chartForResult: unknown tool');
    }
  }
}
