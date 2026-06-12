import pg from 'pg';

const { Pool } = pg;

function cuid(): string {
  const timestamp = Date.now().toString(36);
  const randomPart1 = Math.random().toString(36).slice(2, 10);
  const randomPart2 = Math.random().toString(36).slice(2, 10);
  return `c${timestamp}${randomPart1}${randomPart2}`;
}

function buildPoolConfig() {
  const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/venue_equipment';
  if (!url || !url.startsWith('postgresql')) {
    return {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'venue_equipment',
    };
  }
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432', 10),
    user: decodeURIComponent(parsed.username || 'postgres'),
    password: decodeURIComponent(parsed.password || ''),
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
    ssl: parsed.searchParams.get('sslmode') === 'require' ? true : undefined,
  };
}

const pool = new Pool(buildPoolConfig());

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export interface TxClient {
  query: (text: string, params?: any[]) => Promise<any>;
}

async function query(text: string, params?: any[]): Promise<any> {
  const res = await pool.query(text, params);
  return res;
}

async function transaction<T>(fn: (client: TxClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

function sql(strings: TemplateStringsArray, ...values: any[]): { text: string; values: any[] } {
  let text = '';
  const params: any[] = [];
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  }
  return { text, values: params };
}

export { pool, query, transaction, cuid, sql };
export default pool;
