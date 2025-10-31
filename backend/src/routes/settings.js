import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { ApiSettings } from '../models/ApiSettings.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's API settings
router.get('/apis', async (req, res) => {
  try {
    const settings = ApiSettings.findByUserId(req.user.id);
    
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

// Update user's API settings
router.put('/apis', async (req, res) => {
  try {
    const { tmdb_api_key, jellyfin_url, jellyfin_api_key, comicvine_api_key, currency } = req.body;
    
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
        comicvine_api_key: settings.comicvine_api_key || ''
      }
    });
  } catch (error) {
    console.error('Error updating API settings:', error);
    res.status(500).json({ error: 'Failed to update API settings' });
  }
});

export default router;
