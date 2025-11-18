import db from '../config/database.js';

export function migrateFavorites() {
  console.log('🔄 Adding favorite column to items table...');
  
  try {
    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(items)").all();
    const hasFavoriteColumn = tableInfo.some(col => col.name === 'favorite');
    
    if (!hasFavoriteColumn) {
      db.exec(`
        ALTER TABLE items 
        ADD COLUMN favorite BOOLEAN DEFAULT 0
      `);
      console.log('✅ Successfully added favorite column');
    } else {
      console.log('✅ Favorite column already exists');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

// Run migration if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  migrateFavorites();
  process.exit(0);
}
