import { z } from 'zod';
import { withVendor } from '@/lib/db';

// ---------------------------------------------------------------------------
// cancellation_summary — total orders, canceled orders, and cancellation rate
// for the active vendor over an optional date range.
//
// Denominator semantics (IMPORTANT):
//   total_orders    = distinct orders in the window with at least one line
//                     item from this vendor's products. Canceled orders ARE
//                     INCLUDED in this count (a cancellation rate of
//                     canceled / (total - canceled) would be a different
//                     metric).
//   canceled_orders = subset of total_orders that has a matching row in
//                     ORDER_CANCELLATIONS (per functional-spec §8 rule 5).
//   rate_pct        = canceled_orders / total_orders * 100, computed in JS
//                     after SQL returns (avoids conditional SQL and keeps the
//                     template trivial).
//
// reason_category is NOT used in this slice. The follow-up slice will add a
// `group_by: 'reason_category'` mode that emits the existing `pie` variant.
//
// Empty: if total_orders === 0 the tool returns [] — the route's existing
// `rows.length === 0` path emits status:'empty' unchanged.
// ---------------------------------------------------------------------------

export const cancellationSummaryArgsSchema = z.object({
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from must be YYYY-MM-DD')
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to must be YYYY-MM-DD')
    .optional(),
});

export type CancellationSummaryArgs = z.infer<
  typeof cancellationSummaryArgsSchema
>;

export type CancellationSummaryRow = {
  total_orders: number;
  canceled_orders: number;
};

// NOTE: intentionally NO `NOT EXISTS (order_cancellations)` filter — we want
// canceled orders counted in the denominator. LEFT JOIN with COUNT(DISTINCT
// oc.order_id) counts only non-null join rows, which is exactly the canceled
// subset.
const SQL = `
SELECT
  COUNT(DISTINCT o.id)::int        AS total_orders,
  COUNT(DISTINCT oc.order_id)::int AS canceled_orders
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders   o ON o.id = oi.order_id
LEFT JOIN order_cancellations oc ON oc.order_id = o.id
WHERE p.vendor_id = $1::uuid
  AND ($2::date IS NULL OR o.order_date::date >= $2::date)
  AND ($3::date IS NULL OR o.order_date::date <= $3::date)
`;

export function cancellationRatePct(row: CancellationSummaryRow): number {
  if (row.total_orders === 0) return 0;
  return (row.canceled_orders / row.total_orders) * 100;
}

async function run(
  args: CancellationSummaryArgs,
  vendorId: string,
): Promise<CancellationSummaryRow[]> {
  const scoped = withVendor(vendorId);
  const res = await scoped.query<CancellationSummaryRow>(SQL, [
    args.date_from ?? null,
    args.date_to ?? null,
  ]);
  const row = res.rows[0];
  if (!row) return [];
  // Tool-internal empty: no orders at all in the window.
  if (row.total_orders === 0) return [];
  return [row];
}

export const cancellationSummary = {
  name: 'cancellation_summary' as const,
  argSchema: cancellationSummaryArgsSchema,
  run,
};
