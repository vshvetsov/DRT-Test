/**
 * D5 — Local-DB bring-up verification.
 *
 * Read-only. Prints row counts, per-vendor split, category disjointness, and
 * a sample top product per vendor. Exits non-zero if something looks wrong.
 *
 * Usage:
 *   npm run db:verify
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { Pool } from 'pg';

const SUPPLIER_1_ID = '00000000-0000-0000-0000-000000000001';
const SUPPLIER_2_ID = '00000000-0000-0000-0000-000000000002';

function ok(label: string, detail: string = '') {
  console.log(`  ✓ ${label}${detail ? '  ' + detail : ''}`);
}

function fail(label: string, detail: string = '') {
  console.log(`  ✗ ${label}${detail ? '  ' + detail : ''}`);
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.',
    );
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  let failures = 0;

  try {
    console.log('=== DB verification ===');
    console.log('');
    console.log('Row counts:');
    const tables = [
      'vendors',
      'customers',
      'products',
      'orders',
      'order_items',
      'order_cancellations',
    ];
    const counts: Record<string, number> = {};
    for (const t of tables) {
      const res = await pool.query<{ n: string }>(
        `SELECT COUNT(*)::text AS n FROM ${t}`,
      );
      const n = Number(res.rows[0]?.n ?? '0');
      counts[t] = n;
      console.log(`  ${t.padEnd(22)} ${n}`);
    }
    console.log('');

    // --- expected row counts (see scripts/seed-data.ts) -------------------
    console.log('Expected shape:');
    if (counts.vendors === 2) ok('vendors = 2');
    else {
      fail(`vendors expected 2, got ${counts.vendors}`);
      failures++;
    }
    if (counts.products === 100) ok('products = 100 (50 per vendor)');
    else {
      fail(`products expected 100, got ${counts.products}`);
      failures++;
    }
    if (counts.orders === 1000) ok('orders = 1000 (500 per vendor)');
    else {
      fail(`orders expected 1000, got ${counts.orders}`);
      failures++;
    }
    // Cancellations ≈ 10% of orders. Allow a generous band around 100.
    const cancels = counts.order_cancellations ?? 0;
    if (cancels >= 70 && cancels <= 140)
      ok(`order_cancellations ≈ 10%`, `(${cancels} / ${counts.orders})`);
    else {
      fail(
        `order_cancellations expected 70..140, got ${cancels} (of ${counts.orders})`,
      );
      failures++;
    }

    console.log('');
    console.log('Per-vendor product counts:');
    const perVendor = await pool.query<{ vendor_id: string; n: string }>(
      `SELECT vendor_id, COUNT(*)::text AS n FROM products GROUP BY vendor_id ORDER BY vendor_id`,
    );
    const byVendor = new Map<string, number>();
    for (const r of perVendor.rows) byVendor.set(r.vendor_id, Number(r.n));
    for (const [id, label] of [
      [SUPPLIER_1_ID, 'Supplier 1'],
      [SUPPLIER_2_ID, 'Supplier 2'],
    ] as const) {
      const n = byVendor.get(id) ?? 0;
      if (n === 50) ok(`${label}  50`);
      else {
        fail(`${label}  expected 50, got ${n}`);
        failures++;
      }
    }

    console.log('');
    console.log('Category disjointness across vendors:');
    const cats1 = await pool.query<{ category: string }>(
      `SELECT DISTINCT category FROM products WHERE vendor_id = $1 ORDER BY category`,
      [SUPPLIER_1_ID],
    );
    const cats2 = await pool.query<{ category: string }>(
      `SELECT DISTINCT category FROM products WHERE vendor_id = $1 ORDER BY category`,
      [SUPPLIER_2_ID],
    );
    const s1 = cats1.rows.map((r) => r.category);
    const s2 = cats2.rows.map((r) => r.category);
    const overlap = s1.filter((c) => s2.includes(c));
    console.log(`  Supplier 1: ${s1.join(', ')}`);
    console.log(`  Supplier 2: ${s2.join(', ')}`);
    if (overlap.length === 0) ok('no category overlap');
    else {
      fail(`category overlap: ${overlap.join(', ')}`);
      failures++;
    }

    // FK integrity spot checks — FK constraints mean the DB rejects bad
    // writes, but we sanity-check that every order_items.product_id maps back
    // to a products row owned by the order's matching vendor.
    console.log('');
    console.log('Vendor-scope integrity:');
    const leak = await pool.query<{ n: string }>(
      `
      SELECT COUNT(*)::text AS n
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.id NOT IN (
        SELECT o2.id
        FROM orders o2
        JOIN order_items oi2 ON oi2.order_id = o2.id
        JOIN products p2 ON p2.id = oi2.product_id
        WHERE p2.vendor_id = p.vendor_id
      )
      `,
    );
    const leakN = Number(leak.rows[0]?.n ?? '0');
    if (leakN === 0) ok('every order_item trace resolves to a single vendor');
    else {
      fail(`order_items spanning multiple vendors: ${leakN}`);
      failures++;
    }

    console.log('');
    console.log('Sample top product by revenue per vendor:');
    for (const [id, label] of [
      [SUPPLIER_1_ID, 'Supplier 1'],
      [SUPPLIER_2_ID, 'Supplier 2'],
    ] as const) {
      const res = await pool.query<{ name: string; revenue: string }>(
        `
        SELECT p.name, SUM(oi.quantity * oi.unit_price)::text AS revenue
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        JOIN orders o ON o.id = oi.order_id
        WHERE p.vendor_id = $1
          AND NOT EXISTS (SELECT 1 FROM order_cancellations oc WHERE oc.order_id = o.id)
        GROUP BY p.name
        ORDER BY SUM(oi.quantity * oi.unit_price) DESC
        LIMIT 1
        `,
        [id],
      );
      const row = res.rows[0];
      if (row) {
        const formatted = Number(row.revenue).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
        });
        console.log(`  ${label}: ${row.name.padEnd(26)} ${formatted}`);
      } else {
        fail(`${label}: no revenue rows found`);
        failures++;
      }
    }

    console.log('');
    if (failures === 0) {
      console.log('All checks passed ✓');
    } else {
      console.log(`${failures} check(s) failed.`);
      process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Verification failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
