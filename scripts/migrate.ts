/**
 * D3 — Migrate script.
 *
 * DESTRUCTIVE: drops and recreates all six tables by applying db/schema.sql.
 * Safely re-runnable; idempotent against a fresh or existing database.
 *
 * Usage:
 *   npm run db:migrate
 *
 * Reads DATABASE_URL from .env.local (loaded the same way Next.js loads it).
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import fs from 'node:fs/promises';
import path from 'node:path';
import { Pool } from 'pg';

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.password) u.password = '***';
    return u.toString();
  } catch {
    return '<unparseable DATABASE_URL>';
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

  const schemaPath = path.resolve(process.cwd(), 'db', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');

  console.warn('⚠️  DESTRUCTIVE MIGRATE — drops and recreates all six tables.');
  console.warn(`    Target: ${redactUrl(url)}`);

  const pool = new Pool({ connectionString: url });
  try {
    await pool.query(schema);
    console.log('✓ Schema applied from db/schema.sql. Six tables recreated.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
