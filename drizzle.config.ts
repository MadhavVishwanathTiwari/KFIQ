import { defineConfig } from "drizzle-kit";

// Migrations/schema push: prefer direct Supabase URL when set (pooler can fail on DDL).
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;

if (!url) {
  throw new Error("Set DATABASE_URL or DATABASE_URL_DIRECT for drizzle-kit");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
