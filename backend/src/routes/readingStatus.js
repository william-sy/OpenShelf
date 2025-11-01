import express from 'express';
import ReadingStatus from '../models/ReadingStatus.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/reading-status/:itemId
 * Get reading status for a specific item
 */
router.get('/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    const status = ReadingStatus.getByItemAndUser(itemId, userId);
    
    if (!status) {
      return res.json({ status: null });
    }

    res.json(status);
  } catch (error) {
    console.error('Error fetching reading status:', error);
    res.status(500).json({ error: 'Failed to fetch reading status' });
  }
});

/**
 * PUT /api/reading-status/:itemId
 * Update or create reading status for an item
 */
router.put('/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;
    const { status, start_date, end_date } = req.body;

    // Validate status
    const validStatuses = ['want_to_read', 'reading', 'read'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Auto-set dates based on status
    let startDate = start_date;
    let endDate = end_date;

    // If setting to 'reading' and no start_date, set it to today
    if (status === 'reading' && !startDate) {
      startDate = new Date().toISOString().split('T')[0];
    }

    // If setting to 'read' and no end_date, set it to today
    if (status === 'read' && !endDate) {
      endDate = new Date().toISOString().split('T')[0];
    }

    ReadingStatus.upsert(itemId, userId, status, startDate, endDate);
    
    const updated = ReadingStatus.getByItemAndUser(itemId, userId);
    res.json(updated);
  } catch (error) {
    console.error('Error updating reading status:', error);
    res.status(500).json({ error: 'Failed to update reading status' });
  }
});

/**
 * DELETE /api/reading-status/:itemId
 * Delete reading status for an item
 */
router.delete('/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user.id;

    ReadingStatus.delete(itemId, userId);
    res.json({ message: 'Reading status deleted successfully' });
  } catch (error) {
    console.error('Error deleting reading status:', error);
    res.status(500).json({ error: 'Failed to delete reading status' });
  }
});

/**
 * GET /api/reading-status/user/list
 * Get all reading statuses for current user
 */
router.get('/user/list', (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const statuses = ReadingStatus.getByUser(userId, status);
    res.json(statuses);
  } catch (error) {
    console.error('Error fetching user reading statuses:', error);
    res.status(500).json({ error: 'Failed to fetch reading statuses' });
  }
});

/**
 * GET /api/reading-status/stats
 * Get reading statistics for current user
 */
router.get('/stats/overview', (req, res) => {
  try {
    const userId = req.user.id;

    const stats = ReadingStatus.getReadingStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching reading stats:', error);
    res.status(500).json({ error: 'Failed to fetch reading statistics' });
  }
});

export default router;
