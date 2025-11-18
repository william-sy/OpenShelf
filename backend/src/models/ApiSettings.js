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
      if (settingsData.allow_registration !== undefined) {
        updates.push('allow_registration = ?');
        values.push(settingsData.allow_registration ? 1 : 0);
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
        INSERT INTO api_settings (user_id, tmdb_api_key, jellyfin_url, jellyfin_api_key, comicvine_api_key, currency, allow_registration)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        userId,
        settingsData.tmdb_api_key || null,
        settingsData.jellyfin_url || null,
        settingsData.jellyfin_api_key || null,
        settingsData.comicvine_api_key || null,
        settingsData.currency || 'USD',
        settingsData.allow_registration !== undefined ? (settingsData.allow_registration ? 1 : 0) : 1
      );
      
      return this.findByUserId(userId);
    }
  },

  // Get system-wide registration setting
  isRegistrationAllowed() {
    // Check settings from first admin user (system-wide settings)
    const settings = db.prepare('SELECT allow_registration FROM api_settings WHERE user_id = 1').get();
    // Default to true if not set
    return settings ? Boolean(settings.allow_registration) : true;
  },

  delete(userId) {
    const stmt = db.prepare('DELETE FROM api_settings WHERE user_id = ?');
    return stmt.run(userId).changes > 0;
  }
};
