import db from '../config/database.js';

// Migration to add label settings columns to api_settings table
console.log('Adding label settings columns to api_settings table...');

try {
  // Check if columns already exist
  const tableInfo = db.prepare("PRAGMA table_info(api_settings)").all();
  const columnNames = tableInfo.map(col => col.name);
  
  // Add label settings columns if they don't exist
  if (!columnNames.includes('label_base_url')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_base_url TEXT').run();
    console.log('✓ Added label_base_url column');
  }
  
  if (!columnNames.includes('label_width')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_width INTEGER DEFAULT 210').run();
    console.log('✓ Added label_width column');
  }
  
  if (!columnNames.includes('label_height')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_height INTEGER DEFAULT 297').run();
    console.log('✓ Added label_height column');
  }
  
  if (!columnNames.includes('label_show_title')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_title INTEGER DEFAULT 1').run();
    console.log('✓ Added label_show_title column');
  }
  
  if (!columnNames.includes('label_show_type')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_type INTEGER DEFAULT 1').run();
    console.log('✓ Added label_show_type column');
  }
  
  if (!columnNames.includes('label_show_creators')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_creators INTEGER DEFAULT 1').run();
    console.log('✓ Added label_show_creators column');
  }
  
  if (!columnNames.includes('label_show_cover')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_cover INTEGER DEFAULT 1').run();
    console.log('✓ Added label_show_cover column');
  }
  
  // Add new customization columns
  if (!columnNames.includes('label_qr_size')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_qr_size INTEGER DEFAULT 180').run();
    console.log('✓ Added label_qr_size column');
  }
  
  if (!columnNames.includes('label_cover_size')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_cover_size INTEGER DEFAULT 60').run();
    console.log('✓ Added label_cover_size column');
  }
  
  if (!columnNames.includes('label_show_isbn')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_isbn INTEGER DEFAULT 0').run();
    console.log('✓ Added label_show_isbn column');
  }
  
  if (!columnNames.includes('label_show_publisher')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_publisher INTEGER DEFAULT 0').run();
    console.log('✓ Added label_show_publisher column');
  }
  
  if (!columnNames.includes('label_show_year')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_year INTEGER DEFAULT 0').run();
    console.log('✓ Added label_show_year column');
  }
  
  if (!columnNames.includes('label_show_location')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_location INTEGER DEFAULT 0').run();
    console.log('✓ Added label_show_location column');
  }
  
  if (!columnNames.includes('label_show_url')) {
    db.prepare('ALTER TABLE api_settings ADD COLUMN label_show_url INTEGER DEFAULT 1').run();
    console.log('✓ Added label_show_url column');
  }
  
  console.log('Migration completed successfully!');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}
