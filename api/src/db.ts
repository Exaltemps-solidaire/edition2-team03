import { Pool } from "pg";

export function createPool(databaseUrl: string) {
  return new Pool({ connectionString: databaseUrl });
}

// §5.5: the API is the single owner of the app's schema.
export async function migrate(pg: Pool) {
  await pg.query(`CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pg.query(`CREATE INDEX IF NOT EXISTS tasks_created_at ON tasks (created_at DESC)`);
}
