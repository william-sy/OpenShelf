import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { ApiSettings } from '../models/ApiSettings.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get API settings (all users can view, but shared across all users)
router.get('/apis', async (req, res) => {
  try {
    // In shared library model, we use user_id = 1 (first admin) for system-wide settings
    const adminUser = req.user.role === 'admin' ? req.user.id : 1;
    const settings = ApiSettings.findByUserId(adminUser);
    
    if (!settings) {
      return res.json({
        tmdb_api_key: '',
        jellyfin_url: '',
        jellyfin_api_key: '',
        comicvine_api_key: '',
        currency: 'USD'
      });
    }
    
    res.json({
      tmdb_api_key: settings.tmdb_api_key || '',
      jellyfin_url: settings.jellyfin_url || '',
      jellyfin_api_key: settings.jellyfin_api_key || '',
      comicvine_api_key: settings.comicvine_api_key || '',
      currency: settings.currency || 'USD'
    });
  } catch (error) {
    console.error('Error fetching API settings:', error);
    res.status(500).json({ error: 'Failed to fetch API settings' });
  }
});

// Update API settings (admin only)
router.put('/apis', requireAdmin, async (req, res) => {
  try {
    const { tmdb_api_key, jellyfin_url, jellyfin_api_key, comicvine_api_key, currency } = req.body;
    
    // Store settings under the admin's user ID (system-wide settings)
    const settings = ApiSettings.upsert(req.user.id, {
      tmdb_api_key,
      jellyfin_url,
      jellyfin_api_key,
      comicvine_api_key,
      currency
    });
    
    res.json({
      message: 'API settings updated successfully',
      settings: {
        tmdb_api_key: settings.tmdb_api_key || '',
        jellyfin_url: settings.jellyfin_url || '',
        jellyfin_api_key: settings.jellyfin_api_key || '',
        comicvine_api_key: settings.comicvine_api_key || '',
        currency: settings.currency || 'USD'
      }
    });
  } catch (error) {
    console.error('Error updating API settings:', error);
    res.status(500).json({ error: 'Failed to update API settings' });
  }
});

export default router;
