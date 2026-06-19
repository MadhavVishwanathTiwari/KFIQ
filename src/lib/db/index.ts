import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function isSupabasePoolerUrl(url: string) {
  return url.includes("pooler.supabase.com");
}

function createPostgresClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  return postgres(connectionString, {
    // Safe for Supabase pooler (session + transaction modes).
    prepare: false,
    ssl: isSupabasePoolerUrl(connectionString) ? "require" : undefined,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

type PostgresClient = ReturnType<typeof postgres>;

const globalForDb = globalThis as typeof globalThis & {
  postgresClient?: PostgresClient;
};

const client = globalForDb.postgresClient ?? createPostgresClient();

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
