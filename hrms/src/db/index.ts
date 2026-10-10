import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Db = NodePgDatabase<typeof schema>;

// The pool and Drizzle instance are created on first use, not at import time.
// This lets `next build` run without a database (pages are rendered on demand).
const globalForDb = globalThis as unknown as { __hrmsPool?: Pool; __hrmsDb?: Db };

export function getPool(): Pool {
  if (!globalForDb.__hrmsPool) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    globalForDb.__hrmsPool = new Pool({ connectionString: url, max: 10 });
  }
  return globalForDb.__hrmsPool;
}

function getDb(): Db {
  if (!globalForDb.__hrmsDb) globalForDb.__hrmsDb = drizzle(getPool(), { schema });
  return globalForDb.__hrmsDb;
}

/** Lazy proxies so existing `import { db }` call sites keep working. */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const target = getDb();
    const value = Reflect.get(target, prop, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const target = getPool();
    const value = Reflect.get(target, prop, target);
    return typeof value === "function" ? value.bind(target) : value;
  },
});

export * from "./schema";
