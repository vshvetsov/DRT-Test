import { z } from 'zod';
import { withVendor } from '@/lib/db';

// ---------------------------------------------------------------------------
// simple_total — scalar aggregate over a required date range. Returns a
// single-row result carrying all three metrics (revenue, units, orders_count);
// the dispatcher picks the one matching args.metric. Same "compute all
// metrics, caller picks" pattern as the ranked and sales_over_time tools.
//
// Empty semantics are different from the row-collection tools: the aggregate
// SQL always returns exactly one row (possibly all zeros). The run function
// returns `[]` when the user's chosen metric is zero or null, so the route's
// existing `rows.length === 0` → status:'empty' path handles it unchanged.
// ---------------------------------------------------------------------------

export const simpleTotalArgsSchema = z.object({
  metric: z.enum(['revenue', 'orders', 'units']),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from must be YYYY-MM-DD'),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to must be YYYY-MM-DD'),
});

export type SimpleTotalArgs = z.infer<typeof simpleTotalArgsSchema>;

export type SimpleTotalRow = {
  revenue: number;
  units: number;
  orders_count: number;
};

// COALESCE guards against NULL from SUM over an empty set. COUNT already
// returns 0 on empty input. All three metrics are always non-null numbers.
const SQL = `
SELECT
  COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float AS revenue,
  COALESCE(SUM(oi.quantity), 0)::int                   AS units,
  COUNT(DISTINCT o.id)::int                            AS orders_count
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders   o ON o.id = oi.order_id
WHERE p.vendor_id = $1::uuid
  AND NOT EXISTS (
    SELECT 1 FROM order_cancellations oc WHERE oc.order_id = o.id
  )
  AND o.order_date::date >= $2::date
  AND o.order_date::date <= $3::date
`;

export function getSimpleTotalValue(
  row: SimpleTotalRow,
  metric: SimpleTotalArgs['metric'],
): number {
  switch (metric) {
    case 'revenue':
      return row.revenue;
    case 'orders':
      return row.orders_count;
    case 'units':
      return row.units;
  }
}

async function run(
  args: SimpleTotalArgs,
  vendorId: string,
): Promise<SimpleTotalRow[]> {
  const scoped = withVendor(vendorId);
  const res = await scoped.query<SimpleTotalRow>(SQL, [
    args.date_from,
    args.date_to,
  ]);
  const row = res.rows[0];
  if (!row) return [];
  const value = getSimpleTotalValue(row, args.metric);
  // Tool-internal empty: no meaningful aggregate for the chosen metric.
  if (value <= 0) return [];
  return [row];
}

export const simpleTotal = {
  name: 'simple_total' as const,
  argSchema: simpleTotalArgsSchema,
  run,
};
