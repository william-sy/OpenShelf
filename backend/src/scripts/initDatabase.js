import db from '../config/database.js';
import bcrypt from 'bcryptjs';

export function initializeDatabase() {
  console.log('🔧 Initializing database...');

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create items table (extensible for different media types)
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('book', 'comic', 'cd', 'dvd', 'bluray', 'vinyl', 'ebook', 'other')),
      title TEXT NOT NULL,
      subtitle TEXT,
      creators TEXT, -- JSON array of {name, role} objects
      isbn TEXT,
      barcode TEXT,
      publisher TEXT,
      publish_date TEXT,
      description TEXT,
      cover_url TEXT,
      page_count INTEGER,
      language TEXT,
      metadata TEXT, -- JSON for extensible fields
      notes TEXT,
      tags TEXT, -- JSON array
      rating INTEGER CHECK(rating >= 0 AND rating <= 5),
      condition TEXT CHECK(condition IN ('mint', 'good', 'fair', 'poor')),
      location TEXT,
      purchase_date DATE,
      purchase_price REAL,
      tmdb_id TEXT, -- TMDB ID for movies/TV shows
      jellyfin_id TEXT, -- Jellyfin ID for linking to media server
      jellyfin_url TEXT, -- Direct playback URL in Jellyfin
      file_path TEXT, -- Path to ebook file for digital books
      comicvine_id TEXT, -- Comic Vine ID for comics
      wishlist BOOLEAN DEFAULT 0, -- Mark items as wishlist items
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Check if migration is needed (old schema with 'authors' column)
  const tableInfo = db.prepare("PRAGMA table_info(items)").all();
  const hasAuthorsColumn = tableInfo.some(col => col.name === 'authors');
  const hasCreatorsColumn = tableInfo.some(col => col.name === 'creators');
  const hasBarcodeColumn = tableInfo.some(col => col.name === 'barcode');

  if (hasAuthorsColumn && !hasCreatorsColumn) {
    console.log('🔄 Migrating database schema: authors → creators...');
    
    // Clean up any failed previous migration attempt
    try {
      db.exec('DROP TABLE IF EXISTS items_new');
    } catch (e) {
      // Ignore errors
    }
    
    // Use transaction for safe migration
    const transaction = db.transaction(() => {
      // Create new table with updated schema
      db.exec(`
        CREATE TABLE items_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL CHECK(type IN ('book', 'comic', 'cd', 'dvd', 'bluray', 'vinyl', 'ebook', 'other')),
          title TEXT NOT NULL,
          subtitle TEXT,
          creators TEXT,
          isbn TEXT,
          barcode TEXT,
          publisher TEXT,
          publish_date TEXT,
          description TEXT,
          cover_url TEXT,
          page_count INTEGER,
          language TEXT,
          metadata TEXT,
          notes TEXT,
          tags TEXT,
          rating INTEGER CHECK(rating >= 0 AND rating <= 5),
          condition TEXT CHECK(condition IN ('mint', 'good', 'fair', 'poor')),
          location TEXT,
          purchase_date DATE,
          purchase_price REAL,
          tmdb_id TEXT,
          jellyfin_id TEXT,
          jellyfin_url TEXT,
          file_path TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Get all items from old table
      const oldItems = db.prepare('SELECT * FROM items').all();
      
      // Prepare insert statement
      const insert = db.prepare(`
        INSERT INTO items_new (
          id, user_id, type, title, subtitle, creators, isbn, barcode,
          publisher, publish_date, description, cover_url, page_count,
          language, metadata, notes, tags, rating, condition, location,
          purchase_date, purchase_price, tmdb_id, jellyfin_id, jellyfin_url,
          file_path, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      // Convert each item
      for (const item of oldItems) {
        let creators = null;
        if (item.authors) {
          try {
            const authorsArray = JSON.parse(item.authors);
            creators = JSON.stringify(
              authorsArray.map(name => ({ name, role: 'author' }))
            );
          } catch (e) {
            console.warn(`Warning: Could not parse authors for item ${item.id}`);
          }
        }
        
        insert.run(
          item.id,
          item.user_id,
          item.type,
          item.title,
          item.subtitle,
          creators,
          item.isbn,
          item.barcode || item.isbn, // Use ISBN as barcode if barcode doesn't exist
          item.publisher,
          item.publish_date,
          item.description,
          item.cover_url,
          item.page_count,
          item.language,
          item.metadata,
          item.notes,
          item.tags,
          item.rating,
          item.condition,
          item.location,
          item.purchase_date,
          item.purchase_price,
          item.tmdb_id || null,
          item.jellyfin_id || null,
          item.jellyfin_url || null,
          item.file_path || null,
          item.created_at,
          item.updated_at
        );
      }

      // Drop old table and rename new one
      db.exec('DROP TABLE items');
      db.exec('ALTER TABLE items_new RENAME TO items');
    });
    
    transaction();
    console.log('✅ Schema migration completed');
  } else if (tableInfo.length > 0 && !hasBarcodeColumn) {
    // Add barcode column if table exists but doesn't have it
    console.log('🔄 Adding barcode column...');
    db.exec(`ALTER TABLE items ADD COLUMN barcode TEXT`);
    console.log('✅ Barcode column added');
  }

  // Check if users table needs display_name column
  const usersTableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasDisplayName = usersTableInfo.some(col => col.name === 'display_name');
  
  if (usersTableInfo.length > 0 && !hasDisplayName) {
    console.log('🔄 Adding display_name column to users table...');
    db.exec(`ALTER TABLE users ADD COLUMN display_name TEXT`);
    console.log('✅ Display name column added');
  }

  // Add new columns if they don't exist (for existing databases)
  const itemsTableInfo = db.prepare("PRAGMA table_info(items)").all();
  const newColumns = [
    { name: 'tmdb_id', type: 'TEXT', sql: 'ALTER TABLE items ADD COLUMN tmdb_id TEXT' },
    { name: 'jellyfin_id', type: 'TEXT', sql: 'ALTER TABLE items ADD COLUMN jellyfin_id TEXT' },
    { name: 'jellyfin_url', type: 'TEXT', sql: 'ALTER TABLE items ADD COLUMN jellyfin_url TEXT' },
    { name: 'file_path', type: 'TEXT', sql: 'ALTER TABLE items ADD COLUMN file_path TEXT' },
    { name: 'comicvine_id', type: 'TEXT', sql: 'ALTER TABLE items ADD COLUMN comicvine_id TEXT' },
    { name: 'wishlist', type: 'BOOLEAN', sql: 'ALTER TABLE items ADD COLUMN wishlist BOOLEAN DEFAULT 0' }
  ];

  for (const col of newColumns) {
    const hasColumn = itemsTableInfo.some(c => c.name === col.name);
    if (itemsTableInfo.length > 0 && !hasColumn) {
      console.log(`🔄 Adding ${col.name} column to items table...`);
      db.exec(col.sql);
      console.log(`✅ ${col.name} column added`);
    }
  }

  // Create lending table (for future use)
  db.exec(`
    CREATE TABLE IF NOT EXISTS lending (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      borrower_name TEXT NOT NULL,
      borrower_contact TEXT,
      lent_date DATE NOT NULL,
      due_date DATE,
      returned_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
    )
  `);

  // Create API settings table (for user-specific API configurations)
  db.exec(`
    CREATE TABLE IF NOT EXISTS api_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      tmdb_api_key TEXT,
      jellyfin_url TEXT,
      jellyfin_api_key TEXT,
      comicvine_api_key TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id)
    )
  `);

  // Create reading_status table for tracking reading progress
  db.exec(`
    CREATE TABLE IF NOT EXISTS reading_status (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('want_to_read', 'reading', 'read')),
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(item_id, user_id)
    )
  `);

  // Add comicvine_api_key column to existing api_settings table if needed
  const apiSettingsTableInfo = db.prepare("PRAGMA table_info(api_settings)").all();
  const hasComicVineKey = apiSettingsTableInfo.some(col => col.name === 'comicvine_api_key');
  const hasCurrency = apiSettingsTableInfo.some(col => col.name === 'currency');
  
  if (apiSettingsTableInfo.length > 0 && !hasComicVineKey) {
    console.log('🔄 Adding comicvine_api_key column to api_settings table...');
    db.exec(`ALTER TABLE api_settings ADD COLUMN comicvine_api_key TEXT`);
    console.log('✅ comicvine_api_key column added');
  }
  
  if (apiSettingsTableInfo.length > 0 && !hasCurrency) {
    console.log('🔄 Adding currency column to api_settings table...');
    db.exec(`ALTER TABLE api_settings ADD COLUMN currency TEXT DEFAULT 'USD'`);
    console.log('✅ currency column added');
  }

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    CREATE INDEX IF NOT EXISTS idx_items_isbn ON items(isbn);
    CREATE INDEX IF NOT EXISTS idx_items_barcode ON items(barcode);
    CREATE INDEX IF NOT EXISTS idx_items_title ON items(title);
    CREATE INDEX IF NOT EXISTS idx_lending_item_id ON lending(item_id);
    CREATE INDEX IF NOT EXISTS idx_api_settings_user_id ON api_settings(user_id);
    CREATE INDEX IF NOT EXISTS idx_reading_status_item_user ON reading_status(item_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_reading_status_user_status ON reading_status(user_id, status);
  `);

  // Create default admin user if not exists
  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  
  if (!adminExists) {
    const passwordHash = bcrypt.hashSync('admin', 10);
    db.prepare(`
      INSERT INTO users (username, email, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('admin', 'admin@openshelf.local', passwordHash, 'admin');
    
    console.log('✅ Default admin user created (username: admin, password: admin)');
    console.log('⚠️  Please change the default password!');
  }

  console.log('✅ Database initialized successfully');
}

// Run initialization if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
  process.exit(0);
}
