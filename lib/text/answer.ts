import type { TopProductsArgs, TopProductsRow } from '@/lib/tools/top-products';

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

function describeRange(args: TopProductsArgs): string {
  if (args.date_from && args.date_to)
    return ` from ${args.date_from} through ${args.date_to}`;
  if (args.date_from) return ` from ${args.date_from}`;
  if (args.date_to) return ` through ${args.date_to}`;
  return '';
}

export function textForTopProducts(
  rows: TopProductsRow[],
  args: TopProductsArgs,
): string {
  const metric = args.metric === 'revenue' ? 'revenue' : 'units sold';
  const range = describeRange(args);
  const leader = rows[0];
  if (!leader) {
    // Defensive: caller should emit `status: 'empty'` before reaching here.
    return `No product sales${range}.`;
  }
  const fmt = args.metric === 'revenue' ? formatUsd : formatCount;
  const value = args.metric === 'revenue' ? leader.revenue : leader.units;
  return `Your top ${rows.length} products by ${metric}${range}. Leader: ${leader.product_name} at ${fmt(value)}.`;
}
