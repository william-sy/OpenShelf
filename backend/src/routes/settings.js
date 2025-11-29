import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';
import { ApiSettings } from '../models/ApiSettings.js';

const router = express.Router();

// Public endpoint for currency setting (no auth required)
router.get('/currency', async (req, res) => {
  try {
    // Get system-wide currency setting from admin user (user_id = 1)
    const settings = ApiSettings.findByUserId(1);
    
    res.json({
      currency: settings?.currency || 'USD'
    });
  } catch (error) {
    console.error('Error fetching currency setting:', error);
    res.json({ currency: 'USD' }); // Return default on error
  }
});

// Public endpoint to check if registration is allowed (no auth required)
router.get('/registration-status', async (req, res) => {
  try {
    const allowed = ApiSettings.isRegistrationAllowed();
    res.json({ allowed });
  } catch (error) {
    console.error('Error checking registration status:', error);
    res.json({ allowed: true }); // Default to true on error
  }
});

// All other routes require authentication
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
      currency: settings.currency || 'USD',
      allow_registration: settings?.allow_registration !== undefined ? Boolean(settings.allow_registration) : true
    });
  } catch (error) {
    console.error('Error fetching API settings:', error);
    res.status(500).json({ error: 'Failed to fetch API settings' });
  }
});

// Update API settings (admin only)
router.put('/apis', requireAdmin, async (req, res) => {
  try {
    const { tmdb_api_key, jellyfin_url, jellyfin_api_key, comicvine_api_key, currency, allow_registration } = req.body;
    
    // Store settings under the admin's user ID (system-wide settings)
    const settings = ApiSettings.upsert(req.user.id, {
      tmdb_api_key,
      jellyfin_url,
      jellyfin_api_key,
      comicvine_api_key,
      currency,
      allow_registration
    });
    
    res.json({
      message: 'API settings updated successfully',
      settings: {
        tmdb_api_key: settings.tmdb_api_key || '',
        jellyfin_url: settings.jellyfin_url || '',
        jellyfin_api_key: settings.jellyfin_api_key || '',
        comicvine_api_key: settings.comicvine_api_key || '',
        currency: settings.currency || 'USD',
        allow_registration: settings?.allow_registration !== undefined ? Boolean(settings.allow_registration) : true
      }
    });
  } catch (error) {
    console.error('Error updating API settings:', error);
    res.status(500).json({ error: 'Failed to update API settings' });
  }
});

// Get label settings (authenticated users)
router.get('/labels', authenticateToken, (req, res) => {
  try {
    // Get system-wide label settings from admin user (user_id = 1)
    const settings = ApiSettings.findByUserId(1);
    
    const labelSettings = {
      baseUrl: settings?.label_base_url || '',
      labelWidth: settings?.label_width || 210,
      labelHeight: settings?.label_height || 297,
      orientation: settings?.label_orientation || 'portrait',
      fontSize: settings?.label_font_size || 12,
      qrSize: settings?.label_qr_size || 180,
      coverSize: settings?.label_cover_size || 60,
      showTitle: settings?.label_show_title !== undefined ? Boolean(settings.label_show_title) : true,
      showType: settings?.label_show_type !== undefined ? Boolean(settings.label_show_type) : true,
      showCreators: settings?.label_show_creators !== undefined ? Boolean(settings.label_show_creators) : true,
      showCover: settings?.label_show_cover !== undefined ? Boolean(settings.label_show_cover) : true,
      showIsbn: settings?.label_show_isbn !== undefined ? Boolean(settings.label_show_isbn) : false,
      showPublisher: settings?.label_show_publisher !== undefined ? Boolean(settings.label_show_publisher) : false,
      showYear: settings?.label_show_year !== undefined ? Boolean(settings.label_show_year) : false,
      showLocation: settings?.label_show_location !== undefined ? Boolean(settings.label_show_location) : false,
      showUrl: settings?.label_show_url !== undefined ? Boolean(settings.label_show_url) : true,
      imageDpi: settings?.label_image_dpi || 302,
      textAlign: settings?.label_text_align || 'left',
      showSpine: settings?.label_show_spine !== undefined ? Boolean(settings.label_show_spine) : false,
      spineWidth: settings?.label_spine_width || 10,
      mirrorLayout: settings?.label_mirror_layout !== undefined ? Boolean(settings.label_mirror_layout) : false,
    };
    
    res.json(labelSettings);
  } catch (error) {
    console.error('Error fetching label settings:', error);
    res.status(500).json({ error: 'Failed to fetch label settings' });
  }
});

// Update label settings (admin only)
router.put('/labels', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { 
      baseUrl, labelWidth, labelHeight, orientation, fontSize, qrSize, coverSize,
      showTitle, showType, showCreators, showCover,
      showIsbn, showPublisher, showYear, showLocation, showUrl,
      imageDpi, textAlign, showSpine, spineWidth, mirrorLayout
    } = req.body;
    
    // Store settings under the admin's user ID (system-wide settings)
    const settings = ApiSettings.upsert(req.user.id, {
      label_base_url: baseUrl,
      label_width: labelWidth,
      label_height: labelHeight,
      label_orientation: orientation,
      label_font_size: fontSize,
      label_qr_size: qrSize,
      label_cover_size: coverSize,
      label_show_title: showTitle,
      label_show_type: showType,
      label_show_creators: showCreators,
      label_show_cover: showCover,
      label_show_isbn: showIsbn,
      label_show_publisher: showPublisher,
      label_show_year: showYear,
      label_show_location: showLocation,
      label_show_url: showUrl,
      label_image_dpi: imageDpi,
      label_text_align: textAlign,
      label_show_spine: showSpine,
      label_spine_width: spineWidth,
      label_mirror_layout: mirrorLayout,
    });
    
    res.json({
      message: 'Label settings updated successfully',
      settings: {
        baseUrl: settings.label_base_url || '',
        labelWidth: settings.label_width || 210,
        labelHeight: settings.label_height || 297,
        orientation: settings.label_orientation || 'portrait',
        fontSize: settings.label_font_size || 12,
        qrSize: settings.label_qr_size || 180,
        coverSize: settings.label_cover_size || 60,
        showTitle: Boolean(settings.label_show_title),
        showType: Boolean(settings.label_show_type),
        showCreators: Boolean(settings.label_show_creators),
        showCover: Boolean(settings.label_show_cover),
        showIsbn: Boolean(settings.label_show_isbn),
        showPublisher: Boolean(settings.label_show_publisher),
        showYear: Boolean(settings.label_show_year),
        showLocation: Boolean(settings.label_show_location),
        showUrl: Boolean(settings.label_show_url),
        imageDpi: settings.label_image_dpi || 302,
        textAlign: settings.label_text_align || 'left',
        showSpine: Boolean(settings.label_show_spine),
        spineWidth: settings.label_spine_width || 10,
        mirrorLayout: Boolean(settings.label_mirror_layout),
      }
    });
  } catch (error) {
    console.error('Error updating label settings:', error);
    res.status(500).json({ error: 'Failed to update label settings' });
  }
});

export default router;
