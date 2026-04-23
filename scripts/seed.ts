/**
 * D4 — Seed script.
 *
 * DESTRUCTIVE: truncates all six tables with CASCADE and repopulates with
 * deterministic fixtures.
 *
 * Usage:
 *   npm run db:seed                              # default reference date
 *   SEED_REFERENCE_DATE=2026-01-15 npm run db:seed
 *
 * Re-running with the same reference date produces byte-identical data.
 * Assumes db/schema.sql has already been applied (run `npm run db:migrate`
 * first).
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { Pool, type PoolClient } from 'pg';
import {
  DEFAULT_REFERENCE_DATE,
  generate,
  resolveReferenceDate,
  type OrderCancellation,
  type OrderItem,
  type SeedData,
} from './seed-data';

const INSERT_BATCH_SIZE = 500;

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return '<unparseable DATABASE_URL>';
  }
}

type Column = string;

async function insertMany(
  client: PoolClient,
  table: string,
  columns: Column[],
  rows: unknown[][],
): Promise<void> {
  if (rows.length === 0) return;
  for (let offset = 0; offset < rows.length; offset += INSERT_BATCH_SIZE) {
    const batch = rows.slice(offset, offset + INSERT_BATCH_SIZE);
    const placeholders: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    for (const row of batch) {
      const cells: string[] = [];
      for (const cell of row) {
        cells.push(`$${p++}`);
        params.push(cell);
      }
      placeholders.push(`(${cells.join(', ')})`);
    }
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`;
    await client.query(sql, params);
  }
}

async function writeSeed(client: PoolClient, data: SeedData): Promise<void> {
  await client.query('BEGIN');
  try {
    // Destructive: wipe everything first. CASCADE isn't strictly required
    // because we list every FK-dependent table, but it matches the plan's
    // wording and is defensive.
    await client.query(
      'TRUNCATE TABLE order_cancellations, order_items, orders, products, customers, vendors CASCADE',
    );

    await insertMany(
      client,
      'vendors',
      ['id', 'company_name', 'contact_email', 'status', 'created_at'],
      data.vendors.map((v) => [
        v.id,
        v.company_name,
        v.contact_email,
        v.status,
        v.created_at,
      ]),
    );

    await insertMany(
      client,
      'customers',
      ['id', 'email', 'region', 'signup_date'],
      data.customers.map((c) => [c.id, c.email, c.region, c.signup_date]),
    );

    await insertMany(
      client,
      'products',
      [
        'id',
        'vendor_id',
        'sku',
        'name',
        'category',
        'unit_price',
        'created_at',
      ],
      data.products.map((p) => [
        p.id,
        p.vendor_id,
        p.sku,
        p.name,
        p.category,
        p.unit_price,
        p.created_at,
      ]),
    );

    await insertMany(
      client,
      'orders',
      [
        'id',
        'customer_id',
        'order_date',
        'status',
        'total_amount',
        'shipped_at',
        'delivered_at',
      ],
      data.orders.map((o) => [
        o.id,
        o.customer_id,
        o.order_date,
        o.status,
        o.total_amount,
        o.shipped_at,
        o.delivered_at,
      ]),
    );

    await insertMany(
      client,
      'order_items',
      ['id', 'order_id', 'product_id', 'quantity', 'unit_price'],
      data.orderItems.map((oi: OrderItem) => [
        oi.id,
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.unit_price,
      ]),
    );

    await insertMany(
      client,
      'order_cancellations',
      [
        'id',
        'order_id',
        'reason_category',
        'detailed_reason',
        'cancelled_at',
      ],
      data.cancellations.map((c: OrderCancellation) => [
        c.id,
        c.order_id,
        c.reason_category,
        c.detailed_reason,
        c.cancelled_at,
      ]),
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.',
    );
    process.exit(1);
  }

  const referenceDate = resolveReferenceDate(process.env.SEED_REFERENCE_DATE);
  const data = generate(referenceDate);

  console.warn('⚠️  DESTRUCTIVE SEED — truncates all six tables and repopulates.');
  console.warn(`    Target:         ${redactUrl(url)}`);
  console.warn(
    `    Reference date: ${referenceDate.toISOString().slice(0, 10)}` +
      (process.env.SEED_REFERENCE_DATE ? ' (override)' : ` (default: ${DEFAULT_REFERENCE_DATE})`),
  );

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    await writeSeed(client, data);
  } finally {
    client.release();
    await pool.end();
  }

  console.log('✓ Seed complete. Row counts:');
  console.log(`    vendors              ${data.vendors.length}`);
  console.log(`    customers            ${data.customers.length}`);
  console.log(`    products             ${data.products.length}`);
  console.log(`    orders               ${data.orders.length}`);
  console.log(`    order_items          ${data.orderItems.length}`);
  console.log(`    order_cancellations  ${data.cancellations.length}`);
}

main().catch((err) => {
  console.error('Seed failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
