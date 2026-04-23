import type {
  RankedProductsArgs,
  RankedProductsRow,
  ToolResult,
} from '@/lib/tools';

// ---------------------------------------------------------------------------
// Server-side text templates. Numbers come only from tool payloads — the LLM
// never writes response text.
// ---------------------------------------------------------------------------

function formatUsd(v: number): string {
  return v.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}

function formatCount(v: number): string {
  return v.toLocaleString('en-US');
}

function describeRange(args: RankedProductsArgs): string {
  if (args.date_from && args.date_to)
    return ` from ${args.date_from} through ${args.date_to}`;
  if (args.date_from) return ` from ${args.date_from}`;
  if (args.date_to) return ` through ${args.date_to}`;
  return '';
}

function answerForRankedProducts(
  rows: RankedProductsRow[],
  args: RankedProductsArgs,
  direction: 'top' | 'bottom',
): string {
  const metric = args.metric === 'revenue' ? 'revenue' : 'units sold';
  const range = describeRange(args);
  const pivot = rows[0];
  if (!pivot) {
    // Defensive: caller should emit `status: 'empty'` before reaching here.
    return `No product sales${range}.`;
  }
  const prefix = direction === 'top' ? 'top' : 'bottom';
  const pivotLabel = direction === 'top' ? 'Leader' : 'Lowest';
  const fmt = args.metric === 'revenue' ? formatUsd : formatCount;
  const value = args.metric === 'revenue' ? pivot.revenue : pivot.units;
  return `Your ${prefix} ${rows.length} products by ${metric}${range}. ${pivotLabel}: ${pivot.product_name} at ${fmt(value)}.`;
}

// ---------------------------------------------------------------------------
// answerForResult — the single entry point. Discriminates on toolName so any
// future tool must add a branch or the TypeScript never-check fails.
// ---------------------------------------------------------------------------

export function answerForResult(result: ToolResult): string {
  switch (result.toolName) {
    case 'top_products':
      return answerForRankedProducts(result.rows, result.args, 'top');
    case 'bottom_products':
      return answerForRankedProducts(result.rows, result.args, 'bottom');
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      throw new Error('answerForResult: unknown tool');
    }
  }
}
