/**
 * setup-db.mjs
 * Creates all Supabase tables required by the congonews app.
 *
 * Usage:
 *   npm run db:setup             — connects to Supabase and runs the SQL
 *   npm run db:setup -- --print  — prints the SQL to paste in Supabase SQL Editor
 *
 * For the direct connection, add SUPABASE_DB_PASSWORD to your .env
 * (Supabase → Settings → Database → Database password).
 * Alternatively, run with --print and paste the output into Supabase → SQL Editor.
 */

import pg from 'pg'
import { config } from 'dotenv'

config()

const { Client } = pg

const SQL = `
-- Enable pgvector extension (required for embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- articles (NewsAPI items)
CREATE TABLE IF NOT EXISTS articles (
  id                   TEXT PRIMARY KEY,
  source               TEXT,
  name                 TEXT,
  description          TEXT,
  title                TEXT,
  url                  TEXT,
  external_image_urls  TEXT[],
  profile_image_link   TEXT,
  date_posted          TIMESTAMPTZ,
  videos               JSONB,
  embedding            VECTOR(1536),
  theme                TEXT
);

-- tweets (BrightData / X items)
CREATE TABLE IF NOT EXISTS tweets (
  id                    TEXT PRIMARY KEY,
  source                TEXT,
  user_posted           TEXT,
  name                  TEXT,
  description           TEXT,
  date_posted           TIMESTAMPTZ,
  photos                JSONB,
  url                   TEXT,
  profile_image_link    TEXT,
  external_image_urls   TEXT[],
  videos                JSONB,
  external_video_urls   TEXT[],
  user_id               TEXT,
  timestamp             BIGINT,
  embedding             VECTOR(1536),
  theme                 TEXT
);

-- sources (X accounts to scrape)
CREATE TABLE IF NOT EXISTS sources (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT NOT NULL,
  name        TEXT,
  active      BOOLEAN DEFAULT TRUE,
  start_date  TEXT,
  end_date    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- theme_centroids (pgvector centroids per theme)
CREATE TABLE IF NOT EXISTS theme_centroids (
  theme_name            TEXT PRIMARY KEY,
  centroid_vector       VECTOR(1536),
  seed_count            INTEGER,
  embedding_model       TEXT,
  embedding_dimensions  INTEGER,
  computed_at           TIMESTAMPTZ
);
`

// --print: output SQL to paste in Supabase SQL Editor, no DB connection needed
if (process.argv.includes('--print')) {
  console.log(SQL)
  process.exit(0)
}

// Build connection URL from env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const dbPassword = process.env.SUPABASE_DB_PASSWORD
const explicitUrl = process.env.DATABASE_URL

let DATABASE_URL = explicitUrl

if (!DATABASE_URL) {
  if (!supabaseUrl || !dbPassword) {
    console.error('No database connection URL found.\n')
    console.error('Option A — set SUPABASE_DB_PASSWORD in .env')
    console.error('           (Supabase -> Settings -> Database -> Database password)\n')
    console.error('Option B — paste the SQL in Supabase SQL Editor:')
    console.error('           npm run db:setup -- --print')
    process.exit(1)
  }
  const ref = new URL(supabaseUrl).hostname.split('.')[0]
  DATABASE_URL = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${ref}.supabase.co:5432/postgres`
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  console.log('Connecting to database...')
  await client.connect()
  console.log('Running migrations...')
  await client.query(SQL)
  console.log('All tables created successfully.')
  console.log('Tables: articles, tweets, sources, theme_centroids')
  await client.end()
}

main().catch(async (err) => {
  console.error('Setup failed:', err.message)
  await client.end().catch(() => {})
  process.exit(1)
})
