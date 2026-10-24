// Additive, repeatable migration for existing deployments. No existing records are rewritten.
require("dotenv").config({ quiet: true });
const { neon } = require("@neondatabase/serverless");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const sql = neon(process.env.DATABASE_URL);
  await sql.transaction([
    sql`ALTER TABLE "entries" ADD COLUMN IF NOT EXISTS "translation" varchar(16)`,
    sql`ALTER TABLE "memory_verses" ADD COLUMN IF NOT EXISTS "translation" varchar(16)`,
    sql`ALTER TABLE "highlights" ADD COLUMN IF NOT EXISTS "selection" jsonb`,
  ]);
  const columns = await sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' AND ((table_name IN ('entries', 'memory_verses') AND column_name = 'translation') OR (table_name = 'highlights' AND column_name = 'selection'))`;
  if (columns.length !== 3) throw new Error("The Scripture annotation migration could not be verified.");
  console.log("Verified Scripture translation and highlight selection columns.");
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
