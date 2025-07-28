const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from root directory
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigrations() {
    try {
        console.log('🚀 Starting database migration application...');
        
        // Ensure migrations table exists
        await supabase.rpc('execute_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS _migrations (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        });

        // Get applied migrations
        let { data: applied, error: selectError } = await supabase
            .from('_migrations')
            .select('name');
            
        if (selectError) {
            // If the table doesn't exist, it's the first run
            if (selectError.code === '42P01') {
                applied = [];
            } else {
                throw selectError;
            }
        }

        const appliedNames = new Set(applied.map(m => m.name));
        
        const migrationsDir = path.join(__dirname, '../database/migrations');
        const migrationFiles = fs.readdirSync(migrationsDir).sort();
        
        for (const file of migrationFiles) {
            if (file.endsWith('.sql') && !appliedNames.has(file)) {
                console.log(`Applying migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                const { error: execError } = await supabase.rpc('execute_sql', { sql });

                if (execError) {
                    console.error(`Error applying migration ${file}:`, execError);
                    throw execError;
                }

                // Record the migration
                await supabase.from('_migrations').insert({ name: file });

                console.log(`✅ Migration ${file} applied successfully.`);
            } else if (file.endsWith('.sql')) {
                console.log(`Skipping already applied migration: ${file}`);
            }
        }
        
        console.log('\n🎉 All migrations are up to date!');
        
    } catch (error) {
        console.error('❌ Error applying migrations:', error);
        process.exit(1);
    }
}

applyMigrations(); 