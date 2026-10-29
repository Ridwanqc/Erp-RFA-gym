import pg from 'pg';

export let pgPool: pg.Pool | null = null;

if (process.env.DATABASE_URL) {
  try {
    const isSsl = process.env.DATABASE_URL.includes('sslmode=require') || process.env.DB_SSL === 'true';
    pgPool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined
    });

    pgPool.query('SELECT 1').then(() => {
      console.log('[PostgreSQL] Connected successfully to database');
    }).catch((err) => {
      console.warn('[PostgreSQL] Database initial ping failed (will retry on requests):', err.message);
    });
  } catch (err: any) {
    console.warn('[PostgreSQL] Pool initialization error:', err?.message);
  }
}
