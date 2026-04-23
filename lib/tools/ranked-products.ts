import { z } from 'zod';
import { withVendor } from '@/lib/db';

// ---------------------------------------------------------------------------
// Shared shape for the two ranked-product tools (`top_products`,
// `bottom_products`). Both take the same inputs and return the same row
// shape — the only real difference is the ORDER BY direction, so the SQL
// template is built once per direction here and re-used by both tools.
// ---------------------------------------------------------------------------

export const rankedProductsArgsSchema = z.object({
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

export type RankedProductsArgs = z.infer<typeof rankedProductsArgsSchema>;

export type RankedProductsRow = {
  product_id: string;
  product_name: string;
  revenue: number;
  units: number;
};

export type RankDirection = 'top' | 'bottom';

// Direction is a module-internal literal, never user-controlled. It is
// interpolated into the SQL string (ORDER BY direction cannot be a bound
// parameter in Postgres). Safety: the value can only be 'top' or 'bottom',
// enforced by the RankDirection type.
function buildSql(direction: RankDirection): string {
  const order = direction === 'top' ? 'DESC' : 'ASC';
  return `
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
  CASE WHEN $4::text = 'revenue' THEN SUM(oi.quantity * oi.unit_price) END ${order} NULLS LAST,
  CASE WHEN $4::text = 'units'   THEN SUM(oi.quantity)::numeric        END ${order} NULLS LAST
LIMIT $5::int
`;
}

const TOP_SQL = buildSql('top');
const BOTTOM_SQL = buildSql('bottom');

export async function runRankedProducts(
  args: RankedProductsArgs,
  vendorId: string,
  direction: RankDirection,
): Promise<RankedProductsRow[]> {
  const sql = direction === 'top' ? TOP_SQL : BOTTOM_SQL;
  const scoped = withVendor(vendorId);
  const res = await scoped.query<RankedProductsRow>(sql, [
    args.date_from ?? null,
    args.date_to ?? null,
    args.metric,
    args.limit,
  ]);
  return res.rows;
}
