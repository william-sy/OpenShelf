import db from '../config/database.js';

export const Item = {
  create(itemData) {
    const {
      user_id,
      type,
      title,
      subtitle,
      creators,
      authors, // Legacy support
      isbn,
      barcode,
      publisher,
      publish_date,
      description,
      cover_url,
      page_count,
      language,
      metadata,
      notes,
      tags,
      rating,
      condition,
      location,
      purchase_date,
      purchase_price,
      tmdb_id,
      jellyfin_id,
      jellyfin_url,
      file_path
    } = itemData;

    const stmt = db.prepare(`
      INSERT INTO items (
        user_id, type, title, subtitle, creators, isbn, barcode, publisher, 
        publish_date, description, cover_url, page_count, language,
        metadata, notes, tags, rating, condition, location,
        purchase_date, purchase_price, tmdb_id, jellyfin_id, jellyfin_url, file_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Convert old authors format to creators if needed
    const creatorsData = creators || (authors ? authors.map(name => ({ name, role: 'author' })) : null);

    const result = stmt.run(
      user_id,
      type,
      title,
      subtitle || null,
      creatorsData ? JSON.stringify(creatorsData) : null,
      isbn || null,
      barcode || null,
      publisher || null,
      publish_date || null,
      description || null,
      cover_url || null,
      page_count || null,
      language || null,
      metadata ? JSON.stringify(metadata) : null,
      notes || null,
      tags ? JSON.stringify(tags) : null,
      rating || null,
      condition || null,
      location || null,
      purchase_date || null,
      purchase_price || null,
      tmdb_id || null,
      jellyfin_id || null,
      jellyfin_url || null,
      file_path || null
    );

    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    const item = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    return this._parseItem(item);
  },

  findByUserId(userId, filters = {}) {
    let query = 'SELECT * FROM items WHERE user_id = ?';
    const params = [userId];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR authors LIKE ? OR isbn LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const items = db.prepare(query).all(...params);
    return items.map(item => this._parseItem(item));
  },

  getAll(filters = {}) {
    let query = 'SELECT * FROM items WHERE 1=1';
    const params = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR creators LIKE ? OR isbn LIKE ? OR barcode LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const items = db.prepare(query).all(...params);
    return items.map(item => this._parseItem(item));
  },

  update(id, itemData) {
    const allowed = [
      'type', 'title', 'subtitle', 'creators', 'authors', 'isbn', 'barcode', 'publisher',
      'publish_date', 'description', 'cover_url', 'page_count', 'language',
      'metadata', 'notes', 'tags', 'rating', 'condition', 'location',
      'purchase_date', 'purchase_price', 'tmdb_id', 'jellyfin_id', 'jellyfin_url', 'file_path'
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(itemData)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        // Stringify arrays and objects
        if (key === 'creators' || key === 'authors' || key === 'tags' || key === 'metadata') {
          values.push(value ? JSON.stringify(value) : null);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) return false;

    values.push(id);
    const stmt = db.prepare(`
      UPDATE items 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(...values).changes > 0;
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM items WHERE id = ?');
    return stmt.run(id).changes > 0;
  },

  getStats(userId) {
    const stmt = db.prepare(`
      SELECT 
        type,
        COUNT(*) as count
      FROM items
      WHERE user_id = ?
      GROUP BY type
    `);
    return stmt.all(userId);
  },

  _parseItem(item) {
    if (!item) return null;

    const parsed = {
      ...item,
      creators: item.creators ? JSON.parse(item.creators) : [],
      tags: item.tags ? JSON.parse(item.tags) : [],
      metadata: item.metadata ? JSON.parse(item.metadata) : {}
    };

    // For backward compatibility, generate authors array from creators
    if (parsed.creators && parsed.creators.length > 0) {
      parsed.authors = parsed.creators.map(c => c.name);
    } else {
      parsed.authors = [];
    }

    return parsed;
  }
};
