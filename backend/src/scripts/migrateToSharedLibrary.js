import db from '../config/database.js';

/**
 * Migration script to convert from per-user libraries to a shared library model.
 * This will:
 * 1. Find the current admin user
 * 2. Reassign all orphaned items to the admin user
 * 3. Update the application logic to show all items to all users (done in routes)
 */
export function migrateToSharedLibrary() {
  console.log('🔄 Migrating to shared library model...');

  try {
    // Find the first admin user (or any user if no admin exists)
    const adminUser = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1").get();
    
    if (!adminUser) {
      console.log('⚠️  No admin user found. Finding any user...');
      const anyUser = db.prepare("SELECT id FROM users ORDER BY created_at ASC LIMIT 1").get();
      
      if (!anyUser) {
        console.log('❌ No users found in database. Cannot migrate items.');
        return;
      }
      
      console.log(`📌 Using user ID ${anyUser.id} as the library owner`);
      
      // Update all items to belong to this user
      const result = db.prepare("UPDATE items SET user_id = ? WHERE user_id != ?").run(anyUser.id, anyUser.id);
      console.log(`✅ Reassigned ${result.changes} orphaned items to user ${anyUser.id}`);
    } else {
      console.log(`📌 Using admin user ID ${adminUser.id} as the library owner`);
      
      // Update all items to belong to the admin user
      const result = db.prepare("UPDATE items SET user_id = ? WHERE user_id != ?").run(adminUser.id, adminUser.id);
      console.log(`✅ Reassigned ${result.changes} items to admin user ${adminUser.id}`);
    }

    // Show statistics
    const totalItems = db.prepare("SELECT COUNT(*) as count FROM items").get();
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();
    
    console.log(`📊 Library statistics:`);
    console.log(`   - Total items: ${totalItems.count}`);
    console.log(`   - Total users: ${totalUsers.count}`);
    console.log(`✅ Migration to shared library complete!`);
    
  } catch (error) {
    console.error('❌ Error during shared library migration:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateToSharedLibrary();
}
