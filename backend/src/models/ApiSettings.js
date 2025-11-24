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
      if (settingsData.label_base_url !== undefined) {
        updates.push('label_base_url = ?');
        values.push(settingsData.label_base_url || null);
      }
      if (settingsData.label_width !== undefined) {
        updates.push('label_width = ?');
        values.push(settingsData.label_width || 210);
      }
      if (settingsData.label_height !== undefined) {
        updates.push('label_height = ?');
        values.push(settingsData.label_height || 297);
      }
      if (settingsData.label_orientation !== undefined) {
        updates.push('label_orientation = ?');
        values.push(settingsData.label_orientation || 'portrait');
      }
      if (settingsData.label_font_size !== undefined) {
        updates.push('label_font_size = ?');
        values.push(settingsData.label_font_size || 12);
      }
      if (settingsData.label_show_title !== undefined) {
        updates.push('label_show_title = ?');
        values.push(settingsData.label_show_title ? 1 : 0);
      }
      if (settingsData.label_show_type !== undefined) {
        updates.push('label_show_type = ?');
        values.push(settingsData.label_show_type ? 1 : 0);
      }
      if (settingsData.label_show_creators !== undefined) {
        updates.push('label_show_creators = ?');
        values.push(settingsData.label_show_creators ? 1 : 0);
      }
      if (settingsData.label_show_cover !== undefined) {
        updates.push('label_show_cover = ?');
        values.push(settingsData.label_show_cover ? 1 : 0);
      }
      if (settingsData.label_qr_size !== undefined) {
        updates.push('label_qr_size = ?');
        values.push(settingsData.label_qr_size || 180);
      }
      if (settingsData.label_cover_size !== undefined) {
        updates.push('label_cover_size = ?');
        values.push(settingsData.label_cover_size || 60);
      }
      if (settingsData.label_show_isbn !== undefined) {
        updates.push('label_show_isbn = ?');
        values.push(settingsData.label_show_isbn ? 1 : 0);
      }
      if (settingsData.label_show_publisher !== undefined) {
        updates.push('label_show_publisher = ?');
        values.push(settingsData.label_show_publisher ? 1 : 0);
      }
      if (settingsData.label_show_year !== undefined) {
        updates.push('label_show_year = ?');
        values.push(settingsData.label_show_year ? 1 : 0);
      }
      if (settingsData.label_show_location !== undefined) {
        updates.push('label_show_location = ?');
        values.push(settingsData.label_show_location ? 1 : 0);
      }
      if (settingsData.label_show_url !== undefined) {
        updates.push('label_show_url = ?');
        values.push(settingsData.label_show_url ? 1 : 0);
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
