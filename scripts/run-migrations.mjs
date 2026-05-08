import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, '.env');
const migrationsDir = path.join(repoRoot, 'scripts', 'migrations');
const migrationsTable = 'public.app_migrations';
const mode = process.argv.includes('--status') ? 'status' : 'apply';

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getMigrationFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b, 'en'));
}

function printList(title, items) {
  console.log(`[migrations] ${title}: ${items.length}`);
  for (const item of items) {
    console.log(`  - ${item}`);
  }
}

async function run() {
  loadEnvFile(envPath);

  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    user: process.env.DB_USER ?? 'postgres',
    password: process.env.DB_PASS ?? 'postgres',
    database: process.env.DB_NAME ?? 'hospital',
  });

  const files = getMigrationFiles(migrationsDir);
  if (!files.length) {
    console.log('[migrations] No .sql migration files found. Skipping.');
    return;
  }

  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${migrationsTable} (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      );
    `);

    const existing = await client.query(`SELECT name FROM ${migrationsTable} ORDER BY name;`);
    const applied = new Set(existing.rows.map((r) => r.name));
    const appliedList = [...applied].sort((a, b) => a.localeCompare(b, 'en'));
    const pending = files.filter((f) => !applied.has(f));

    console.log(
      `[migrations] Mode=${mode} Total=${files.length} Applied=${appliedList.length} Pending=${pending.length}`
    );
    if (appliedList.length) {
      printList('Already applied', appliedList);
    }
    if (pending.length) {
      printList('Pending', pending);
    } else {
      console.log('[migrations] Pending: 0');
    }

    if (mode === 'status') {
      return;
    }

    if (!pending.length) {
      console.log('[migrations] No pending migrations to apply.');
      return;
    }

    console.log(`[migrations] Applying ${pending.length} pending migration(s)...`);
    for (const file of pending) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(`INSERT INTO ${migrationsTable}(name) VALUES ($1)`, [
          file,
        ]);
        await client.query('COMMIT');
        console.log(`[migrations] Applied: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    console.log('[migrations] Apply step complete.');
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  console.error('[migrations] Failed:', err?.message ?? err);
  process.exit(1);
});
