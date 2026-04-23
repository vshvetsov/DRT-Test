import { z } from 'zod';
import { withVendor } from '@/lib/db';

// ---------------------------------------------------------------------------
// Arg schema — Zod for runtime validation; the mirrored JSON Schema used by
// Anthropic tool-use lives in lib/llm/schema.ts.
// ---------------------------------------------------------------------------

export const topProductsArgsSchema = z.object({
  metric: z.enum(['revenue', 'units']),
  limit: z.number().int().min(1).max(20),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_from must be YYYY-MM-DD')
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date_to must be YYYY-MM-DD')
    .optional(),
});

export type TopProductsArgs = z.infer<typeof topProductsArgsSchema>;

export type TopProductsRow = {
  product_id: string;
  product_name: string;
  revenue: number;
  units: number;
};

// ---------------------------------------------------------------------------
// SQL — vendor_id is bound as $1 by withVendor. Parameters from $2 onward
// are owned by this tool.
//
// Shape: revenue & units always computed; ORDER BY picks the active metric.
// Excludes canceled orders (per functional-spec §8 rule 5). Date filters are
// day-precision; nulls mean "no filter".
// ---------------------------------------------------------------------------

const SQL = `
SELECT
  p.id::text           AS product_id,
  p.name               AS product_name,
  SUM(oi.quantity * oi.unit_price)::float AS revenue,
  SUM(oi.quantity)::int                   AS units
FROM order_items oi
JOIN products p ON p.id = oi.product_id
JOIN orders   o ON o.id = oi.order_id
WHERE p.vendor_id = $1::uuid
  AND NOT EXISTS (
    SELECT 1 FROM order_cancellations oc WHERE oc.order_id = o.id
  )
  AND ($2::date IS NULL OR o.order_date::date >= $2::date)
  AND ($3::date IS NULL OR o.order_date::date <= $3::date)
GROUP BY p.id, p.name
ORDER BY
  CASE WHEN $4::text = 'revenue' THEN SUM(oi.quantity * oi.unit_price) END DESC NULLS LAST,
  CASE WHEN $4::text = 'units'   THEN SUM(oi.quantity)::numeric        END DESC NULLS LAST
LIMIT $5::int
`;

async function run(args: TopProductsArgs, vendorId: string): Promise<TopProductsRow[]> {
  const scoped = withVendor(vendorId);
  const res = await scoped.query<TopProductsRow>(SQL, [
    args.date_from ?? null,
    args.date_to ?? null,
    args.metric,
    args.limit,
  ]);
  return res.rows;
}

export const topProducts = {
  name: 'top_products' as const,
  argSchema: topProductsArgsSchema,
  run,
};
