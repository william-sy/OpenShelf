import db from '../config/database.js';

export const ApiSettings = {
  findByUserId(userId) {
    const settings = db.prepare('SELECT * FROM api_settings WHERE user_id = ?').get(userId);
    return settings || null;
  },

  upsert(userId, settingsData) {
    const existing = this.findByUserId(userId);
    
    if (existing) {
      // Update existing settings
      const updates = [];
      const values = [];
      
      if (settingsData.tmdb_api_key !== undefined) {
        updates.push('tmdb_api_key = ?');
        values.push(settingsData.tmdb_api_key || null);
      }
      if (settingsData.jellyfin_url !== undefined) {
        updates.push('jellyfin_url = ?');
        values.push(settingsData.jellyfin_url || null);
      }
      if (settingsData.jellyfin_api_key !== undefined) {
        updates.push('jellyfin_api_key = ?');
        values.push(settingsData.jellyfin_api_key || null);
      }
      if (settingsData.comicvine_api_key !== undefined) {
        updates.push('comicvine_api_key = ?');
        values.push(settingsData.comicvine_api_key || null);
      }
      if (settingsData.currency !== undefined) {
        updates.push('currency = ?');
        values.push(settingsData.currency || 'USD');
      }
      
      if (updates.length === 0) return existing;
      
      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);
      
      const stmt = db.prepare(`
        UPDATE api_settings 
        SET ${updates.join(', ')}
        WHERE user_id = ?
      `);
      stmt.run(...values);
      
      return this.findByUserId(userId);
    } else {
      // Insert new settings
      const stmt = db.prepare(`
        INSERT INTO api_settings (user_id, tmdb_api_key, jellyfin_url, jellyfin_api_key, comicvine_api_key, currency)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        userId,
        settingsData.tmdb_api_key || null,
        settingsData.jellyfin_url || null,
        settingsData.jellyfin_api_key || null,
        settingsData.comicvine_api_key || null,
        settingsData.currency || 'USD'
      );
      
      return this.findByUserId(userId);
    }
  },

  delete(userId) {
    const stmt = db.prepare('DELETE FROM api_settings WHERE user_id = ?');
    return stmt.run(userId).changes > 0;
  }
};
