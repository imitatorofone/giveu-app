const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Supabase configuration - using your actual URL
const supabaseUrl = 'https://rydvyhzbudmtldmfelby.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY not found in .env.local');
  console.log('Please make sure your .env.local file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupDatabase() {
  try {
    console.log('Starting database backup...');
    
    // Get all tables and their data
    const tables = ['needs', 'profiles', 'auth.users']; // Add your table names here
    
    let backupData = {
      timestamp: new Date().toISOString(),
      tables: {}
    };
    
    for (const table of tables) {
      try {
        console.log(`Backing up table: ${table}`);
        
        if (table === 'auth.users') {
          // For auth.users, we need to use the admin client or a different approach
          console.log(`Skipping ${table} - requires admin access`);
          continue;
        }
        
        const { data, error } = await supabase
          .from(table)
          .select('*');
          
        if (error) {
          console.error(`Error backing up ${table}:`, error);
          backupData.tables[table] = { error: error.message };
        } else {
          backupData.tables[table] = data;
          console.log(`✓ Backed up ${data.length} rows from ${table}`);
        }
      } catch (err) {
        console.error(`Error processing table ${table}:`, err);
        backupData.tables[table] = { error: err.message };
      }
    }
    
    // Write backup to file
    const backupPath = path.join(__dirname, 'backups', 'db-2025-09-18.json');
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ Database backup completed: ${backupPath}`);
    console.log(`Backup contains ${Object.keys(backupData.tables).length} tables`);
    
  } catch (error) {
    console.error('Backup failed:', error);
  }
}

backupDatabase();
