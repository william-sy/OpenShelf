import express from 'express';
import { User } from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get current user's preferences
router.get('/me/preferences', (req, res) => {
  try {
    const user = User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      currency: user.currency || 'USD',
      display_name: user.display_name || ''
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update current user's preferences
router.put('/me/preferences', (req, res) => {
  try {
    const { currency } = req.body;
    
    // Update user's currency preference
    const success = User.update(req.user.id, { currency });
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = User.findById(req.user.id);
    res.json({
      message: 'Preferences updated successfully',
      currency: user.currency || 'USD'
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get all users (admin only)
router.get('/', requireAdmin, (req, res) => {
  try {
    const users = User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID (admin only)
router.get('/:id', requireAdmin, (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user (admin only)
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { username, email, role } = req.body;
    const success = User.update(req.params.id, { username, email, role });
    
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = User.findById(req.params.id);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const success = User.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
