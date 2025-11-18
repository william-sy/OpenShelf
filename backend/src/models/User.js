import db from '../config/database.js';

export const User = {
  create(username, email, passwordHash, role = 'reader', displayName = null) {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, display_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(username, email, passwordHash, role, displayName);
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    return db.prepare('SELECT id, username, email, display_name, role, currency, created_at FROM users WHERE id = ?').get(id);
  },

  findByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  findByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  getAll() {
    return db.prepare('SELECT id, username, email, display_name, role, created_at FROM users ORDER BY created_at DESC').all();
  },

  update(id, fields) {
    const allowed = ['username', 'email', 'role', 'display_name', 'profile_picture', 'currency'];
    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(`
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(...values).changes > 0;
  },

  updatePassword(id, passwordHash) {
    const stmt = db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(passwordHash, id).changes > 0;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    return stmt.run(id).changes > 0;
  },

  /**
   * Admin-specific methods
   */
  
  // List all users with item counts
  listAllUsers() {
    return db.prepare(`
      SELECT 
        u.id, 
        u.username, 
        u.email, 
        u.display_name, 
        u.role, 
        u.created_at,
        COUNT(i.id) as item_count
      FROM users u
      LEFT JOIN items i ON u.id = i.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `).all();
  },

  // Update user role (admin operation)
  updateUserRole(id, role) {
    const validRoles = ['admin', 'reader', 'user'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }
    
    const stmt = db.prepare(`
      UPDATE users 
      SET role = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(role, id).changes > 0;
  },

  // Get user statistics
  getUserStats(id) {
    const stats = db.prepare(`
      SELECT 
        COUNT(DISTINCT i.id) as total_items,
        COUNT(DISTINCT CASE WHEN i.wishlist = 1 THEN i.id END) as wishlist_items,
        COUNT(DISTINCT CASE WHEN i.favorite = 1 THEN i.id END) as favorite_items,
        COUNT(DISTINCT rs.id) as reading_statuses,
        COUNT(DISTINCT CASE WHEN rs.status = 'read' THEN rs.id END) as books_read
      FROM users u
      LEFT JOIN items i ON u.id = i.user_id
      LEFT JOIN reading_status rs ON u.id = rs.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `).get(id);
    
    return stats || { total_items: 0, wishlist_items: 0, favorite_items: 0, reading_statuses: 0, books_read: 0 };
  },

  // Reset user password (admin operation)
  resetUserPassword(id, passwordHash) {
    const stmt = db.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(passwordHash, id).changes > 0;
  }
};
