import "dotenv/config";
import fs from "fs";
import path from "path";
import { Client } from "pg";

function tsStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

const ROOT = process.cwd();
const OUTDIR = path.join(ROOT, "backups", `feedback-${tsStamp()}`);
const codeDir = path.join(OUTDIR, "code");
const dataDir = path.join(OUTDIR, "data");
const schemaDir = path.join(OUTDIR, "schema");

// Files to copy if they exist
const COPY_FILES = [
  "app/profile/page.tsx",
  "app/feedback/page.tsx",
  "components/Footer.tsx",
  "components/Header.tsx",
  "constants/giftCategories.js",
  "app/layout.tsx",
  "app/globals.css",
  "tailwind.config.cjs",
].filter((rel) => fs.existsSync(path.join(ROOT, rel)));

const TABLES = [
  "feedback_items",
  "feedback_votes",
  "feedback_attachments",
  "profiles",
  "needs",
];

const VIEW = "feedback_items_with_votes";
const FN = "upvote_feedback_daily";

async function main() {
  // Folders
  fs.mkdirSync(codeDir, { recursive: true });
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(schemaDir, { recursive: true });

  // Copy code files
  for (const rel of COPY_FILES) {
    const src = path.join(ROOT, rel);
    const dst = path.join(codeDir, rel.split("/").join(path.sep));
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }

  const conn = process.env.PG_CONN;
  if (!conn) {
    console.error("Missing PG_CONN in .env.local");
    process.exit(1);
  }

  const client = new Client({ connectionString: conn });
  await client.connect();

  // Dump tables (raw data)
  for (const t of TABLES) {
    try {
      const res = await client.query(`select * from public.${t} order by created_at nulls last`);
      fs.writeFileSync(path.join(dataDir, `${t}.json`), JSON.stringify(res.rows, null, 2), "utf8");
    } catch (e) {
      fs.writeFileSync(path.join(dataDir, `${t}__ERROR.txt`), String(e?.message || e), "utf8");
    }
  }

  // Dump view DDL
  try {
    const v = await client.query(
      `select 'create or replace view '||schemaname||'.'||viewname||' as '||
              pg_get_viewdef((schemaname||'.'||viewname)::regclass, true)||';' as ddl
         from pg_views
        where schemaname='public' and viewname=$1`,
      [VIEW]
    );
    if (v.rows[0]?.ddl) {
      fs.writeFileSync(path.join(schemaDir, `${VIEW}.sql`), v.rows[0].ddl + "\n", "utf8");
    }
  } catch {}

  // Dump function DDL
  try {
    const fn = await client.query(
      `select pg_get_functiondef(p.oid) as ddl
         from pg_proc p
         join pg_namespace n on n.oid = p.pronamespace
        where n.nspname='public' and p.proname=$1
        order by 1 limit 1`,
      [FN]
    );
    if (fn.rows[0]?.ddl) {
      fs.writeFileSync(path.join(schemaDir, `${FN}.sql`), fn.rows[0].ddl + "\n", "utf8");
    }
  } catch {}

  // Dump indexes
  try {
    const idx = await client.query(
      `select indexdef||';' as ddl
         from pg_indexes
        where schemaname='public'
          and tablename = any($1)
        order by 1`,
      [TABLES]
    );
    const body = (idx.rows.map((r) => r.ddl).join("\n") || "") + "\n";
    fs.writeFileSync(path.join(schemaDir, "indexes.sql"), body, "utf8");
  } catch {}

  // Dump constraints (FK + UNIQUE)
  try {
    const cons = await client.query(
      `select 'alter table '||ns.nspname||'.'||rel.relname||' add constraint '||c.conname||' '||
              pg_get_constraintdef(c.oid)||';' as ddl
         from pg_constraint c
         join pg_class rel on rel.oid=c.conrelid
         join pg_namespace ns on ns.oid=rel.relnamespace
        where ns.nspname='public'
          and rel.relname = any($1)
          and c.contype in ('f','u')
        order by 1`,
      [TABLES]
    );
    const body = (cons.rows.map((r) => r.ddl).join("\n") || "") + "\n";
    fs.writeFileSync(path.join(schemaDir, "constraints.sql"), body, "utf8");
  } catch {}

  // Storage note (UI-managed policies)
  const storageNote =
    "Bucket: feedback-attachments\n" +
    "Policies were created via UI:\n" +
    "- public SELECT on bucket_id='feedback-attachments'\n" +
    "- authenticated INSERT on bucket_id='feedback-attachments'\n";
  fs.writeFileSync(path.join(schemaDir, "STORAGE-NOTE.txt"), storageNote, "utf8");

  await client.end();

  // Manifest
  const manifest = {
    createdAt: new Date().toISOString(),
    codeFiles: COPY_FILES,
    tables: TABLES,
    notes: [
      "Function + view + indexes + constraints dumped to schema/",
      "Storage bucket policies are not exported here; see STORAGE-NOTE.txt.",
    ],
  };
  fs.writeFileSync(path.join(OUTDIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

  console.log(` Backup created at ${OUTDIR}`);
}

main().catch((e) => {
  console.error("Backup failed:", e);
  process.exit(1);
});
