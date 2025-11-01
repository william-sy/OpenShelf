import express from 'express';
import { body, validationResult } from 'express-validator';
import Papa from 'papaparse';
import multer from 'multer';
import { Item } from '../models/Item.js';
import ReadingStatus from '../models/ReadingStatus.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

// Configure multer for import file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all items (shared library - all users see all items)
router.get('/', (req, res) => {
  try {
    const { 
      type, 
      search, 
      limit, 
      offset,
      wishlist,
      rating,
      minRating,
      maxRating,
      condition,
      purchaseDateFrom,
      purchaseDateTo,
      publisher,
      location,
      tags,
      excludeTags,
      sortBy,
      sortOrder
    } = req.query;
    
    const filters = {
      type: type ? (type.includes(',') ? type.split(',') : type) : undefined,
      search,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      wishlist: wishlist === 'true' ? true : wishlist === 'false' ? false : undefined,
      rating: rating ? parseInt(rating) : undefined,
      minRating: minRating ? parseInt(minRating) : undefined,
      maxRating: maxRating ? parseInt(maxRating) : undefined,
      condition: condition ? (condition.includes(',') ? condition.split(',') : condition) : undefined,
      purchaseDateFrom,
      purchaseDateTo,
      publisher,
      location,
      tags: tags ? (tags.includes(',') ? tags.split(',') : tags) : undefined,
      excludeTags: excludeTags ? (excludeTags.includes(',') ? excludeTags.split(',') : excludeTags) : undefined,
      sortBy,
      sortOrder
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    // Shared library: show all items to all users
    const items = Item.findAll(filters);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Export items - CSV or JSON format (must be before /:id route)
router.get('/export', (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const items = Item.findAll({}); // Shared library: export all items
    
    // Fetch reading status for all items for current user
    const itemsWithReadingStatus = items.map(item => {
      const readingStatus = ReadingStatus.getByItemAndUser(item.id, req.user.id);
      return {
        ...item,
        reading_status: readingStatus?.status || null,
        reading_start_date: readingStatus?.start_date || null,
        reading_end_date: readingStatus?.end_date || null
      };
    });
    
    if (format === 'csv') {
      // Convert JSON arrays/objects to strings for CSV export
      const csvItems = itemsWithReadingStatus.map(item => ({
        ...item,
        creators: typeof item.creators === 'string' ? item.creators : JSON.stringify(item.creators),
        tags: typeof item.tags === 'string' ? item.tags : JSON.stringify(item.tags),
        metadata: typeof item.metadata === 'string' ? item.metadata : JSON.stringify(item.metadata),
        wishlist: item.wishlist ? 'true' : 'false'
      }));
      
      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="openshelf-export.csv"');
      
      // Send CSV data
      const csv = Papa.unparse(csvItems);
      res.send(csv);
    } else {
      // JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="openshelf-export.json"');
      res.json({
        exportDate: new Date().toISOString(),
        itemCount: itemsWithReadingStatus.length,
        items: itemsWithReadingStatus
      });
    }
  } catch (error) {
    console.error('Error exporting items:', error);
    res.status(500).json({ error: 'Failed to export items' });
  }
});

// Get item by ID (shared library - all users can view)
router.get('/:id', (req, res) => {
  try {
    const item = Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Shared library: all authenticated users can view any item
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new item (admin only)
router.post('/',
  requireAdmin,
  body('type').isIn(['book', 'comic', 'cd', 'vinyl', 'dvd', 'bluray', 'ebook', 'other']),
  body('title').trim().notEmpty(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const itemData = {
        ...req.body,
        user_id: req.user.id
      };

      const item = Item.create(itemData);
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating item:', error);
      res.status(500).json({ error: 'Failed to create item' });
    }
  }
);

// Update item (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const item = Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership
    if (item.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    console.log('Updating item:', req.params.id, 'with data:', req.body);
    const success = Item.update(req.params.id, req.body);
    
    if (!success) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedItem = Item.findById(req.params.id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to update item', message: error.message });
  }
});

// Delete item (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const item = Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership
    if (item.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    Item.delete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get statistics
router.get('/stats/summary', (req, res) => {
  try {
    const stats = Item.getStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get detailed statistics
router.get('/stats/detailed', (req, res) => {
  try {
    const stats = Item.getDetailedStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    res.status(500).json({ error: 'Failed to fetch detailed statistics' });
  }
});

// Import items from CSV or JSON file (admin only)
router.post('/import', requireAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    let items = [];

    // Detect file format
    if (req.file.mimetype === 'application/json' || req.file.originalname.endsWith('.json')) {
      // Parse JSON
      const jsonData = JSON.parse(fileContent);
      items = jsonData.items || jsonData; // Support both wrapped and unwrapped formats
    } else if (req.file.mimetype === 'text/csv' || req.file.originalname.endsWith('.csv')) {
      // Parse CSV
      const parsed = Papa.parse(fileContent, { header: true, skipEmptyLines: true });
      items = parsed.data.map(item => ({
        ...item,
        // Parse JSON fields back from strings
        creators: item.creators ? JSON.parse(item.creators) : null,
        tags: item.tags ? JSON.parse(item.tags) : null,
        metadata: item.metadata ? JSON.parse(item.metadata) : null,
        wishlist: item.wishlist === 'true' || item.wishlist === '1',
        // Parse numeric fields
        page_count: item.page_count ? parseInt(item.page_count) : null,
        rating: item.rating ? parseInt(item.rating) : null,
        purchase_price: item.purchase_price ? parseFloat(item.purchase_price) : null,
        // Ensure date fields are properly formatted
        purchase_date: item.purchase_date || null,
        publish_date: item.publish_date || null
      }));
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Use CSV or JSON.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No valid items found in file' });
    }

    // Validate and import items
    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (const itemData of items) {
      try {
        // Skip items without title
        if (!itemData.title) {
          skipped++;
          continue;
        }

        // Extract reading status fields (not part of item schema)
        const readingStatus = {
          status: itemData.reading_status,
          start_date: itemData.reading_start_date,
          end_date: itemData.reading_end_date
        };

        // Set user_id to current user
        const importItem = {
          ...itemData,
          user_id: req.user.id,
          // Remove id and reading status fields to prevent conflicts
          id: undefined,
          reading_status: undefined,
          reading_start_date: undefined,
          reading_end_date: undefined
        };

        const result = Item.create(importItem);
        const newItemId = result.lastInsertRowid;
        
        // Import reading status if present
        if (readingStatus.status && ['want_to_read', 'reading', 'read'].includes(readingStatus.status)) {
          ReadingStatus.upsert(
            newItemId, 
            req.user.id, 
            readingStatus.status,
            readingStatus.start_date,
            readingStatus.end_date
          );
        }
        
        imported++;
      } catch (error) {
        skipped++;
        errors.push({ title: itemData.title, error: error.message });
      }
    }

    res.json({
      success: true,
      imported,
      skipped,
      total: items.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing items:', error);
    res.status(500).json({ error: 'Failed to import items: ' + error.message });
  }
});

export default router;
