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
      file_path,
      comicvine_id,
      wishlist
    } = itemData;

    const stmt = db.prepare(`
      INSERT INTO items (
        user_id, type, title, subtitle, creators, isbn, barcode, publisher, 
        publish_date, description, cover_url, page_count, language,
        metadata, notes, tags, rating, condition, location,
        purchase_date, purchase_price, tmdb_id, jellyfin_id, jellyfin_url, file_path,
        comicvine_id, wishlist
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      file_path || null,
      comicvine_id || null,
      wishlist ? 1 : 0
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

    // Type filter (can be multiple)
    if (filters.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      const placeholders = types.map(() => '?').join(',');
      query += ` AND type IN (${placeholders})`;
      params.push(...types);
    }

    // Wishlist filter
    if (filters.wishlist !== undefined) {
      query += ' AND wishlist = ?';
      params.push(filters.wishlist ? 1 : 0);
    }

    // Rating filter (exact or range)
    if (filters.rating !== undefined) {
      query += ' AND rating = ?';
      params.push(filters.rating);
    }
    if (filters.minRating !== undefined) {
      query += ' AND rating >= ?';
      params.push(filters.minRating);
    }
    if (filters.maxRating !== undefined) {
      query += ' AND rating <= ?';
      params.push(filters.maxRating);
    }

    // Condition filter
    if (filters.condition) {
      const conditions = Array.isArray(filters.condition) ? filters.condition : [filters.condition];
      const placeholders = conditions.map(() => '?').join(',');
      query += ` AND condition IN (${placeholders})`;
      params.push(...conditions);
    }

    // Date range filters
    if (filters.purchaseDateFrom) {
      query += ' AND purchase_date >= ?';
      params.push(filters.purchaseDateFrom);
    }
    if (filters.purchaseDateTo) {
      query += ' AND purchase_date <= ?';
      params.push(filters.purchaseDateTo);
    }

    // Publisher filter
    if (filters.publisher) {
      query += ' AND publisher LIKE ?';
      params.push(`%${filters.publisher}%`);
    }

    // Location filter
    if (filters.location) {
      query += ' AND location LIKE ?';
      params.push(`%${filters.location}%`);
    }

    // Tags filter (inclusive - must have all specified tags)
    if (filters.tags) {
      const tagList = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
      tagList.forEach(tag => {
        query += ' AND tags LIKE ?';
        params.push(`%"${tag}"%`);
      });
    }

    // Exclude tags filter
    if (filters.excludeTags) {
      const excludeList = Array.isArray(filters.excludeTags) ? filters.excludeTags : [filters.excludeTags];
      excludeList.forEach(tag => {
        query += ' AND (tags IS NULL OR tags NOT LIKE ?)';
        params.push(`%"${tag}"%`);
      });
    }

    // Full-text search (title, creators, isbn, barcode, description, tags)
    if (filters.search) {
      query += ' AND (title LIKE ? OR creators LIKE ? OR isbn LIKE ? OR barcode LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }
    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
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
      'type', 'title', 'subtitle', 'creators', 'isbn', 'barcode', 'publisher',
      'publish_date', 'description', 'cover_url', 'page_count', 'language',
      'metadata', 'notes', 'tags', 'rating', 'condition', 'location',
      'purchase_date', 'purchase_price', 'tmdb_id', 'jellyfin_id', 'jellyfin_url', 'file_path',
      'comicvine_id', 'wishlist'
    ];

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(itemData)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        // Stringify arrays and objects
        if (key === 'creators' || key === 'authors' || key === 'tags' || key === 'metadata') {
          values.push(value ? JSON.stringify(value) : null);
        } else if (key === 'wishlist') {
          // Convert to boolean (0 or 1)
          values.push(value ? 1 : 0);
        } else if (value === '' || value === undefined) {
          // Convert empty strings to null
          values.push(null);
        } else {
          values.push(value);
        }
      }
    }

    if (updates.length === 0) return false;

    values.push(id);
    
    try {
      const stmt = db.prepare(`
        UPDATE items 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
      return stmt.run(...values).changes > 0;
    } catch (error) {
      console.error('Database update error:', error);
      console.error('Updates:', updates);
      console.error('Values:', values);
      throw error;
    }
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

  getDetailedStats(userId) {
    // Get all items for user
    const items = this.findByUserId(userId, {});
    
    // Basic counts by type
    const byType = {};
    items.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1;
    });

    // Counts by rating
    const byRating = {};
    items.forEach(item => {
      if (item.rating) {
        byRating[item.rating] = (byRating[item.rating] || 0) + 1;
      }
    });

    // Counts by condition
    const byCondition = {};
    items.forEach(item => {
      if (item.condition) {
        byCondition[item.condition] = (byCondition[item.condition] || 0) + 1;
      }
    });

    // Top creators (aggregate by name across all items)
    const creatorCounts = {};
    items.forEach(item => {
      const creators = item.creators || [];
      creators.forEach(creator => {
        const name = creator.name;
        if (name) {
          creatorCounts[name] = (creatorCounts[name] || 0) + 1;
        }
      });
    });
    const topCreators = Object.entries(creatorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Top publishers
    const publisherCounts = {};
    items.forEach(item => {
      if (item.publisher) {
        publisherCounts[item.publisher] = (publisherCounts[item.publisher] || 0) + 1;
      }
    });
    const topPublishers = Object.entries(publisherCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Timeline by year (from purchase_date)
    const timeline = {};
    items.forEach(item => {
      if (item.purchase_date) {
        const year = new Date(item.purchase_date).getFullYear();
        if (!isNaN(year)) {
          timeline[year] = (timeline[year] || 0) + 1;
        }
      }
    });
    const timelineArray = Object.entries(timeline)
      .sort((a, b) => a[0] - b[0])
      .map(([year, count]) => ({ year: parseInt(year), count }));

    // Total value
    const totalValue = items.reduce((sum, item) => {
      return sum + (parseFloat(item.purchase_price) || 0);
    }, 0);

    // Wishlist count
    const wishlistCount = items.filter(item => item.wishlist).length;

    return {
      total: items.length,
      wishlistCount,
      byType,
      byRating,
      byCondition,
      topCreators,
      topPublishers,
      timeline: timelineArray,
      totalValue: Math.round(totalValue * 100) / 100
    };
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
