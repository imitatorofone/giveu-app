import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const supabaseUrl = "https://rydvyhzbudmtldmfelby.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5ZHZ5aHpidWRtdGxkbWZlbGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5MTIxOTUsImV4cCI6MjA3MjQ4ODE5NX0.ZUd7r0LKJzS3tT-SvOCim7Vh-AYl3A2eex4bevDlSiU";
const supabase = createClient(supabaseUrl, supabaseKey);

async function restore() {
  try {
    console.log('🔄 Starting database restore...');
    
    const backup = JSON.parse(fs.readFileSync("backups/db-2025-09-18.json", "utf-8"));
    console.log(`📁 Loaded backup from: ${backup.timestamp}`);

    // Restore profiles
    if (backup.tables.profiles && backup.tables.profiles.length > 0) {
      console.log(`🔄 Restoring ${backup.tables.profiles.length} profiles...`);
      for (const row of backup.tables.profiles) {
        const { error } = await supabase.from("profiles").upsert(row);
        if (error) console.error("profiles restore error:", error);
      }
      console.log('✅ Profiles restored');
    }

    // Restore needs
    if (backup.tables.needs && backup.tables.needs.length > 0) {
      console.log(`🔄 Restoring ${backup.tables.needs.length} needs...`);
      for (const row of backup.tables.needs) {
        const { error } = await supabase.from("needs").upsert(row);
        if (error) console.error("needs restore error:", error);
      }
      console.log('✅ Needs restored');
    }

    console.log("✅ Restore complete!");
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
  }
}

restore();
