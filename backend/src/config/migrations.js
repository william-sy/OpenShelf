import db from './database.js';

/**
 * Run all database migrations on startup
 * This ensures the database schema is always up to date
 */
export function runMigrations() {
  console.log('🔄 Running database migrations...');
  
  try {
    // Get current table structure
    const tableInfo = db.prepare("PRAGMA table_info(api_settings)").all();
    const columnNames = tableInfo.map(col => col.name);
    
    let migrationsRun = 0;
    
    // Label settings migrations
    const migrations = [
      { column: 'label_base_url', sql: 'ALTER TABLE api_settings ADD COLUMN label_base_url TEXT' },
      { column: 'label_width', sql: 'ALTER TABLE api_settings ADD COLUMN label_width INTEGER DEFAULT 210' },
      { column: 'label_height', sql: 'ALTER TABLE api_settings ADD COLUMN label_height INTEGER DEFAULT 297' },
      { column: 'label_show_title', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_title INTEGER DEFAULT 1' },
      { column: 'label_show_type', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_type INTEGER DEFAULT 1' },
      { column: 'label_show_creators', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_creators INTEGER DEFAULT 1' },
      { column: 'label_show_cover', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_cover INTEGER DEFAULT 1' },
      { column: 'label_qr_size', sql: 'ALTER TABLE api_settings ADD COLUMN label_qr_size INTEGER DEFAULT 180' },
      { column: 'label_cover_size', sql: 'ALTER TABLE api_settings ADD COLUMN label_cover_size INTEGER DEFAULT 60' },
      { column: 'label_show_isbn', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_isbn INTEGER DEFAULT 0' },
      { column: 'label_show_publisher', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_publisher INTEGER DEFAULT 0' },
      { column: 'label_show_year', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_year INTEGER DEFAULT 0' },
      { column: 'label_show_location', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_location INTEGER DEFAULT 0' },
      { column: 'label_show_url', sql: 'ALTER TABLE api_settings ADD COLUMN label_show_url INTEGER DEFAULT 1' },
      { column: 'label_orientation', sql: 'ALTER TABLE api_settings ADD COLUMN label_orientation TEXT DEFAULT "portrait"' },
      { column: 'label_font_size', sql: 'ALTER TABLE api_settings ADD COLUMN label_font_size INTEGER DEFAULT 12' },
    ];
    
    // Run each migration if needed
    for (const migration of migrations) {
      if (!columnNames.includes(migration.column)) {
        db.prepare(migration.sql).run();
        console.log(`  ✓ Added ${migration.column} column`);
        migrationsRun++;
      }
    }
    
    if (migrationsRun === 0) {
      console.log('  ✓ Database schema is up to date');
    } else {
      console.log(`  ✓ Applied ${migrationsRun} migration(s)`);
    }
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error; // Re-throw to prevent server startup with incomplete schema
  }
}
