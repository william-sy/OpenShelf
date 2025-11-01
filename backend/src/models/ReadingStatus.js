import db from '../config/database.js';

class ReadingStatus {
  /**
   * Get reading status for a specific item and user
   */
  static getByItemAndUser(itemId, userId) {
    return db.prepare(`
      SELECT * FROM reading_status
      WHERE item_id = ? AND user_id = ?
    `).get(itemId, userId);
  }

  /**
   * Get all reading statuses for a user
   */
  static getByUser(userId, status = null) {
    if (status) {
      return db.prepare(`
        SELECT rs.*, i.title, i.type, i.page_count, i.cover_url
        FROM reading_status rs
        JOIN items i ON rs.item_id = i.id
        WHERE rs.user_id = ? AND rs.status = ?
        ORDER BY rs.updated_at DESC
      `).all(userId, status);
    }
    
    return db.prepare(`
      SELECT rs.*, i.title, i.type, i.page_count, i.cover_url
      FROM reading_status rs
      JOIN items i ON rs.item_id = i.id
      WHERE rs.user_id = ?
      ORDER BY rs.updated_at DESC
    `).all(userId);
  }

  /**
   * Upsert (insert or update) reading status
   */
  static upsert(itemId, userId, status, startDate = null, endDate = null) {
    const existing = this.getByItemAndUser(itemId, userId);
    
    if (existing) {
      return db.prepare(`
        UPDATE reading_status
        SET status = ?, start_date = ?, end_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE item_id = ? AND user_id = ?
      `).run(status, startDate, endDate, itemId, userId);
    } else {
      return db.prepare(`
        INSERT INTO reading_status (item_id, user_id, status, start_date, end_date)
        VALUES (?, ?, ?, ?, ?)
      `).run(itemId, userId, status, startDate, endDate);
    }
  }

  /**
   * Delete reading status
   */
  static delete(itemId, userId) {
    return db.prepare(`
      DELETE FROM reading_status
      WHERE item_id = ? AND user_id = ?
    `).run(itemId, userId);
  }

  /**
   * Get reading statistics for a user
   */
  static getReadingStats(userId) {
    // Books completed per month (last 12 months)
    const booksPerMonth = db.prepare(`
      SELECT 
        strftime('%Y-%m', end_date) as month,
        COUNT(*) as count
      FROM reading_status
      WHERE user_id = ? 
        AND status = 'read' 
        AND end_date IS NOT NULL
        AND end_date >= date('now', '-12 months')
      GROUP BY strftime('%Y-%m', end_date)
      ORDER BY month DESC
    `).all(userId);

    // Pages per week (last 8 weeks)
    const pagesPerWeek = db.prepare(`
      SELECT 
        strftime('%Y-W%W', end_date) as week,
        SUM(i.page_count) as total_pages,
        COUNT(*) as books_count
      FROM reading_status rs
      JOIN items i ON rs.item_id = i.id
      WHERE rs.user_id = ? 
        AND rs.status = 'read' 
        AND rs.end_date IS NOT NULL
        AND rs.end_date >= date('now', '-56 days')
        AND i.page_count IS NOT NULL
      GROUP BY strftime('%Y-W%W', end_date)
      ORDER BY week DESC
    `).all(userId);

    // Currently reading
    const currentlyReading = db.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM(i.page_count) as total_pages
      FROM reading_status rs
      JOIN items i ON rs.item_id = i.id
      WHERE rs.user_id = ? AND rs.status = 'reading'
    `).get(userId);

    // Want to read
    const wantToRead = db.prepare(`
      SELECT COUNT(*) as count
      FROM reading_status
      WHERE user_id = ? AND status = 'want_to_read'
    `).get(userId);

    // Total read
    const totalRead = db.prepare(`
      SELECT 
        COUNT(*) as count,
        SUM(i.page_count) as total_pages
      FROM reading_status rs
      JOIN items i ON rs.item_id = i.id
      WHERE rs.user_id = ? AND rs.status = 'read'
    `).get(userId);

    // Reading velocity (pages per day) - based on books with both start and end dates
    const readingVelocity = db.prepare(`
      SELECT 
        AVG(
          CAST(i.page_count AS REAL) / 
          CAST((julianday(rs.end_date) - julianday(rs.start_date)) AS REAL)
        ) as avg_pages_per_day,
        AVG(julianday(rs.end_date) - julianday(rs.start_date)) as avg_days_to_complete
      FROM reading_status rs
      JOIN items i ON rs.item_id = i.id
      WHERE rs.user_id = ? 
        AND rs.status = 'read'
        AND rs.start_date IS NOT NULL
        AND rs.end_date IS NOT NULL
        AND i.page_count IS NOT NULL
        AND julianday(rs.end_date) > julianday(rs.start_date)
    `).get(userId);

    // Recent activity (last 10 status changes)
    const recentActivity = db.prepare(`
      SELECT 
        rs.*,
        i.title,
        i.cover_url,
        i.type
      FROM reading_status rs
      JOIN items i ON rs.item_id = i.id
      WHERE rs.user_id = ?
      ORDER BY rs.updated_at DESC
      LIMIT 10
    `).all(userId);

    return {
      booksPerMonth,
      pagesPerWeek,
      currentlyReading: {
        count: currentlyReading?.count || 0,
        totalPages: currentlyReading?.total_pages || 0
      },
      wantToRead: {
        count: wantToRead?.count || 0
      },
      totalRead: {
        count: totalRead?.count || 0,
        totalPages: totalRead?.total_pages || 0
      },
      readingVelocity: {
        avgPagesPerDay: readingVelocity?.avg_pages_per_day || 0,
        avgDaysToComplete: readingVelocity?.avg_days_to_complete || 0
      },
      recentActivity
    };
  }
}

export default ReadingStatus;
