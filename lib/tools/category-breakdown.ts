import { z } from 'zod';
import { withVendor } from '@/lib/db';

// ---------------------------------------------------------------------------
// category_breakdown — group the vendor's sales by PRODUCTS.category over an
// optional date range. Returns one row per category carrying both metrics;
// the dispatcher picks the one matching args.metric. Same "compute all
// metrics, dispatcher picks" pattern as the other tools.
//
// Unlike ranked tools, there is no limit (a vendor's categories are naturally
// few — 3 in the current seed). Unlike sales_over_time, dates are optional;
// omit for overall-all-time. Empty semantics are the standard row-collection
// rule: zero rows → route emits status:'empty'.
// ---------------------------------------------------------------------------

export const categoryBreakdownArgsSchema = z.object({
  metric: z.enum(['revenue', 'units']),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from must be YYYY-MM-DD')
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to must be YYYY-MM-DD')
    .optional(),
});

export type CategoryBreakdownArgs = z.infer<typeof categoryBreakdownArgsSchema>;

export type CategoryBreakdownRow = {
  category: string;
  revenue: number;
  units: number;
};

const SQL = `
SELECT
  p.category                                           AS category,
  COALESCE(SUM(oi.quantity * oi.unit_price), 0)::float AS revenue,
  COALESCE(SUM(oi.quantity), 0)::int                   AS units
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders   o ON o.id = oi.order_id
WHERE p.vendor_id = $1::uuid
  AND NOT EXISTS (
    SELECT 1 FROM order_cancellations oc WHERE oc.order_id = o.id
  )
  AND ($2::date IS NULL OR o.order_date::date >= $2::date)
  AND ($3::date IS NULL OR o.order_date::date <= $3::date)
GROUP BY p.category
`;

async function run(
  args: CategoryBreakdownArgs,
  vendorId: string,
): Promise<CategoryBreakdownRow[]> {
  const scoped = withVendor(vendorId);
  const res = await scoped.query<CategoryBreakdownRow>(SQL, [
    args.date_from ?? null,
    args.date_to ?? null,
  ]);
  return res.rows;
}

export const categoryBreakdown = {
  name: 'category_breakdown' as const,
  argSchema: categoryBreakdownArgsSchema,
  run,
};
