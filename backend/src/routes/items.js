import express from 'express';
import { body, validationResult } from 'express-validator';
import { Item } from '../models/Item.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all items for current user
router.get('/', (req, res) => {
  try {
    const { type, search, limit } = req.query;
    const filters = {
      type,
      search,
      limit: limit ? parseInt(limit) : undefined
    };

    const items = Item.findByUserId(req.user.id, filters);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get item by ID
router.get('/:id', (req, res) => {
  try {
    const item = Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership
    if (item.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create new item
router.post('/',
  body('type').isIn(['book', 'comic', 'cd', 'dvd', 'other']),
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

// Update item
router.put('/:id', (req, res) => {
  try {
    const item = Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check ownership
    if (item.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const success = Item.update(req.params.id, req.body);
    
    if (!success) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updatedItem = Item.findById(req.params.id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete item
router.delete('/:id', (req, res) => {
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

export default router;
