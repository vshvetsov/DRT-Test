import type {
  RankedProductsArgs,
  RankedProductsRow,
  ToolResult,
} from '@/lib/tools';
import type { ChartPayload } from '@/lib/types';

// ---------------------------------------------------------------------------
// Helpers shared by the ranked-product tools (top / bottom). Title format
// differs only in the "Top" vs "Bottom" prefix.
// ---------------------------------------------------------------------------

function metricLabel(args: RankedProductsArgs): string {
  return args.metric === 'revenue' ? 'revenue' : 'units sold';
}

function describeRange(args: RankedProductsArgs): string {
  if (args.date_from && args.date_to) return `${args.date_from} to ${args.date_to}`;
  if (args.date_from) return `from ${args.date_from}`;
  if (args.date_to) return `through ${args.date_to}`;
  return '';
}

function rankedTitle(
  args: RankedProductsArgs,
  direction: 'top' | 'bottom',
): string {
  const prefix = direction === 'top' ? 'Top' : 'Bottom';
  const range = describeRange(args);
  return `${prefix} ${args.limit} products by ${metricLabel(args)}${range ? ` · ${range}` : ''}`;
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
// chartForResult — the single entry point. Discriminates on toolName so any
// future tool must add a branch or the TypeScript never-check fails.
// ---------------------------------------------------------------------------

export function chartForResult(result: ToolResult): ChartPayload {
  switch (result.toolName) {
    case 'top_products':
      return chartForRankedProducts(result.rows, result.args, 'top');
    case 'bottom_products':
      return chartForRankedProducts(result.rows, result.args, 'bottom');
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      throw new Error('chartForResult: unknown tool');
    }
  }
}
