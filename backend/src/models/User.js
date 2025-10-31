import db from '../config/database.js';

export const User = {
  create(username, email, passwordHash, role = 'user', displayName = null) {
    const stmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, role, display_name)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(username, email, passwordHash, role, displayName);
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    return db.prepare('SELECT id, username, email, display_name, role, created_at FROM users WHERE id = ?').get(id);
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
    const allowed = ['username', 'email', 'role', 'display_name'];
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
  }
};
