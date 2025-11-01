import db from '../config/database.js';

console.log('=== OpenShelf Database Diagnostic ===\n');

try {
  // Check users
  const users = db.prepare('SELECT id, username, email, role, created_at FROM users').all();
  console.log(`📊 Users (${users.length} total):`);
  users.forEach(user => {
    console.log(`   - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Role: ${user.role}`);
  });
  console.log('');

  // Check items
  const items = db.prepare('SELECT id, user_id, type, title, created_at FROM items').all();
  console.log(`📚 Items (${items.length} total):`);
  if (items.length > 0) {
    items.forEach(item => {
      console.log(`   - ID: ${item.id}, User: ${item.user_id}, Type: ${item.type}, Title: ${item.title}`);
    });
  } else {
    console.log('   ⚠️  No items found in database!');
  }
  console.log('');

  // Check reading status
  const readingStatuses = db.prepare('SELECT COUNT(*) as count FROM reading_status').get();
  console.log(`📖 Reading Statuses: ${readingStatuses.count}`);
  console.log('');

  // Check for orphaned items (items with non-existent user_ids)
  const orphanedItems = db.prepare(`
    SELECT i.id, i.user_id, i.title 
    FROM items i 
    LEFT JOIN users u ON i.user_id = u.id 
    WHERE u.id IS NULL
  `).all();
  
  if (orphanedItems.length > 0) {
    console.log(`⚠️  Orphaned Items (${orphanedItems.length} items with invalid user_id):`);
    orphanedItems.forEach(item => {
      console.log(`   - Item ID: ${item.id}, Invalid User ID: ${item.user_id}, Title: ${item.title}`);
    });
    console.log('');
  }

  // Summary
  console.log('=== Summary ===');
  console.log(`Total Users: ${users.length}`);
  console.log(`Total Items: ${items.length}`);
  console.log(`Orphaned Items: ${orphanedItems.length}`);
  
  if (items.length === 0) {
    console.log('\n❌ DATABASE IS EMPTY - Your items were lost during migration!');
    console.log('💡 Do you have a backup of your data/openshelf.db file?');
    console.log('💡 Check if docker volumes still have old data: docker volume ls');
  } else if (orphanedItems.length > 0) {
    console.log('\n⚠️  Found orphaned items - need to reassign to a valid user');
  } else {
    console.log('\n✅ Database looks healthy');
  }

} catch (error) {
  console.error('❌ Error checking database:', error);
}
