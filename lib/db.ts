import { Pool, type QueryResult, type QueryResultRow } from 'pg';
import { env } from './env';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({ connectionString: env.DATABASE_URL });
  }
  return pool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  return getPool().query<T>(sql, params);
}

export type VendorScopedDb = {
  query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    params?: unknown[],
  ): Promise<QueryResult<T>>;
};

// Every tool query must go through withVendor. The signature requires
// vendorId, so forgetting it is a TypeScript error. An empty value throws at
// runtime. vendorId is always bound as $1; tool SQL templates reference it as
// $1 and number their own parameters from $2 onward.
export function withVendor(vendorId: string): VendorScopedDb {
  if (typeof vendorId !== 'string' || vendorId.trim() === '') {
    throw new Error('withVendor: vendorId must be a non-empty string');
  }
  return {
    query<T extends QueryResultRow = QueryResultRow>(
      sql: string,
      params: unknown[] = [],
    ): Promise<QueryResult<T>> {
      return query<T>(sql, [vendorId, ...params]);
    },
  };
}
