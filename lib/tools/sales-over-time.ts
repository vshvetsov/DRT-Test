import { z } from 'zod';
import { withVendor } from '@/lib/db';

// ---------------------------------------------------------------------------
// sales_over_time — time-series of revenue and units per bucket over a
// required date range. Unlike the ranked-product tools, both dates are
// required and there is no limit. The bucket value is passed to
// Postgres's date_trunc via a bound parameter (safe — Zod enum constrains
// it to 'day' | 'week' | 'month').
//
// Row shape carries BOTH metrics; the chart/text dispatcher picks the one
// matching args.metric. Same pattern as ranked-products — keeps a single
// SQL template per tool and avoids branching server-side on the metric.
// ---------------------------------------------------------------------------

export const salesOverTimeArgsSchema = z.object({
  metric: z.enum(['revenue', 'units']),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from must be YYYY-MM-DD'),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to must be YYYY-MM-DD'),
  bucket: z.enum(['day', 'week', 'month']),
});

export type SalesOverTimeArgs = z.infer<typeof salesOverTimeArgsSchema>;

export type SalesOverTimeRow = {
  bucket_start: string; // ISO-ish date (YYYY-MM-DD)
  revenue: number;
  units: number;
};

// Note: date_trunc('week', …) in Postgres uses ISO weeks (Monday start).
// Acceptable for the prototype — the line chart shape is what matters for
// the trend demo, not the weekday boundary.
const SQL = `
SELECT
  to_char(date_trunc($4::text, o.order_date), 'YYYY-MM-DD') AS bucket_start,
  SUM(oi.quantity * oi.unit_price)::float                    AS revenue,
  SUM(oi.quantity)::int                                      AS units
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders   o ON o.id = oi.order_id
WHERE p.vendor_id = $1::uuid
  AND NOT EXISTS (
    SELECT 1 FROM order_cancellations oc WHERE oc.order_id = o.id
  )
  AND o.order_date::date >= $2::date
  AND o.order_date::date <= $3::date
GROUP BY date_trunc($4::text, o.order_date)
ORDER BY date_trunc($4::text, o.order_date) ASC
`;

async function run(
  args: SalesOverTimeArgs,
  vendorId: string,
): Promise<SalesOverTimeRow[]> {
  const scoped = withVendor(vendorId);
  const res = await scoped.query<SalesOverTimeRow>(SQL, [
    args.date_from,
    args.date_to,
    args.bucket,
  ]);
  return res.rows;
}

export const salesOverTime = {
  name: 'sales_over_time' as const,
  argSchema: salesOverTimeArgsSchema,
  run,
};
