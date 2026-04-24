import type {
  RankedProductsArgs,
  RankedProductsRow,
  SalesOverTimeArgs,
  SalesOverTimeRow,
  ToolResult,
} from '@/lib/tools';
import type { ChartPayload } from '@/lib/types';

// ---------------------------------------------------------------------------
// Ranked-product helpers (top / bottom share these).
// ---------------------------------------------------------------------------

function metricLabel(metric: 'revenue' | 'units'): string {
  return metric === 'revenue' ? 'revenue' : 'units sold';
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
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      throw new Error('chartForResult: unknown tool');
    }
  }
}
