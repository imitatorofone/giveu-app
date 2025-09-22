import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { Client } from "pg";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const ROOT       = path.resolve(__dirname, "..");

// Load .env.local first, then .env
dotenv.config({ path: path.join(ROOT, ".env.local") }) || dotenv.config({ path: path.join(ROOT, ".env") });

if (!process.env.PG_CONN) {
  console.error("Missing PG_CONN in .env.local /.env");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.PG_CONN,
  ssl: { rejectUnauthorized: false }
});

// Pick backup folder: argv[2] or latest backups/feedback-*
function latestBackupDir() {
  const dir = path.join(ROOT, "backups");
  if (!fs.existsSync(dir)) return null;
  const list = fs.readdirSync(dir)
    .filter(n => n.startsWith("feedback-"))
    .map(n => ({ n, t: fs.statSync(path.join(dir, n)).mtimeMs }))
    .sort((a,b) => b.t - a.t);
  return list.length ? path.join(dir, list[0].n) : null;
}
const FROM = process.argv[2] ? path.resolve(process.argv[2]) : latestBackupDir();
if (!FROM) {
  console.error("No backup folder found. Pass a path or create one with the backup script.");
  process.exit(1);
}

const DATA   = path.join(FROM, "data");
const SCHEMA = path.join(FROM, "schema");

// Upsert helper for simple UUID PK tables
async function upsertRows(table, rows) {
  if (!rows?.length) return;
  const cols = Object.keys(rows[0]);
  if (!cols.includes("id")) {
    console.warn(`Skipping ${table}: no 'id' column in backup`);
    return;
  }
  const updateCols = cols.filter(c => c !== "id");
  for (const r of rows) {
    const vals = cols.map(c => r[c]);
    const placeholders = cols.map((_, i) => `$${i+1}`).join(", ");
    const setClause = updateCols.map((c, i) => `"${c}" = $${i+1 + cols.indexOf(c)}`).join(", ");
    const sql = `
      insert into public.${table} (${cols.map(c => `"${c}"`).join(", ")})
      values (${placeholders})
      on conflict (id) do update set ${setClause};
    `;
    await client.query(sql, vals);
  }
}

async function runFileIfExists(fp, label) {
  if (fs.existsSync(fp)) {
    const sql = fs.readFileSync(fp, "utf8");
    if (sql.trim()) {
      await client.query(sql);
      console.log(`✓ ${label}`);
    }
  }
}

(async () => {
  console.log(`Restoring from: ${FROM}`);
  await client.connect();
  await client.query("begin");

  // Recreate function and view first (idempotent)
  await runFileIfExists(path.join(SCHEMA, "upvote_feedback_daily.sql"), "function upvote_feedback_daily");
  await runFileIfExists(path.join(SCHEMA, "feedback_items_with_votes.sql"), "view feedback_items_with_votes");

  // Restore tables (idempotent upserts)
  const tables = ["feedback_items", "feedback_votes", "feedback_attachments", "profiles", "needs"];
  for (const t of tables) {
    const fp = path.join(DATA, `${t}.json`);
    if (!fs.existsSync(fp)) continue;
    const rows = JSON.parse(fs.readFileSync(fp, "utf8"));
    console.log(`→ ${t}: ${rows.length} row(s)`);
    await upsertRows(t, rows);
  }

  // Recreate indexes/constraints (optional; harmless if already present)
  await runFileIfExists(path.join(SCHEMA, "indexes.sql"), "indexes");
  await runFileIfExists(path.join(SCHEMA, "constraints.sql"), "constraints");

  await client.query("commit");
  await client.end();
  console.log("✓ Restore complete");
})().catch(async (e) => {
  console.error("Restore failed:", e.message || e);
  try { await client.query("rollback"); } catch {}
  try { await client.end(); } catch {}
  process.exit(1);
});
