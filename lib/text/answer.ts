import type {
  RankedProductsArgs,
  RankedProductsRow,
  SalesOverTimeArgs,
  SalesOverTimeRow,
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

function describeOptionalRange(
  date_from?: string,
  date_to?: string,
): string {
  if (date_from && date_to)
    return ` from ${date_from} through ${date_to}`;
  if (date_from) return ` from ${date_from}`;
  if (date_to) return ` through ${date_to}`;
  return '';
}

// ---------------------------------------------------------------------------
// Ranked products (top / bottom share this).
// ---------------------------------------------------------------------------

function answerForRankedProducts(
  rows: RankedProductsRow[],
  args: RankedProductsArgs,
  direction: 'top' | 'bottom',
): string {
  const metric = args.metric === 'revenue' ? 'revenue' : 'units sold';
  const range = describeOptionalRange(args.date_from, args.date_to);
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
// sales_over_time — short factual one-liner naming the peak bucket.
// ---------------------------------------------------------------------------

function answerForSalesOverTime(
  rows: SalesOverTimeRow[],
  args: SalesOverTimeArgs,
): string {
  const metric = args.metric === 'revenue' ? 'revenue' : 'units sold';
  if (rows.length === 0) {
    return `No sales from ${args.date_from} through ${args.date_to}.`;
  }
  const fmt = args.metric === 'revenue' ? formatUsd : formatCount;
  // Compute the peak bucket from the payload — the LLM never picks numbers.
  let peak = rows[0]!;
  let peakValue = args.metric === 'revenue' ? peak.revenue : peak.units;
  for (const r of rows) {
    const v = args.metric === 'revenue' ? r.revenue : r.units;
    if (v > peakValue) {
      peak = r;
      peakValue = v;
    }
  }
  return `Your ${metric} from ${args.date_from} through ${args.date_to}, bucketed by ${args.bucket}. Peak ${args.bucket}: ${peak.bucket_start} at ${fmt(peakValue)}.`;
}

// ---------------------------------------------------------------------------
// answerForResult — the single entry point.
// ---------------------------------------------------------------------------

export function answerForResult(result: ToolResult): string {
  switch (result.toolName) {
    case 'top_products':
      return answerForRankedProducts(result.rows, result.args, 'top');
    case 'bottom_products':
      return answerForRankedProducts(result.rows, result.args, 'bottom');
    case 'sales_over_time':
      return answerForSalesOverTime(result.rows, result.args);
    default: {
      const _exhaustive: never = result;
      void _exhaustive;
      throw new Error('answerForResult: unknown tool');
    }
  }
}
