import express from 'express';
import { User } from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * List all users with their statistics
 */
router.get('/users', (req, res) => {
  try {
    const users = User.listAllUsers();
    
    // Add statistics for each user
    const usersWithStats = users.map(user => ({
      ...user,
      stats: User.getUserStats(user.id)
    }));
    
    res.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/users/:id
 * Get specific user details
 */
router.get('/users/:id', (req, res) => {
  try {
    const user = User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = User.getUserStats(user.id);
    
    res.json({ ...user, stats });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
router.put('/users/:id/role', (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const user = User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent demoting the last admin
    if (user.role === 'admin' && role !== 'admin') {
      const admins = User.getAll().filter(u => u.role === 'admin');
      if (admins.length === 1) {
        return res.status(400).json({ 
          error: 'Cannot demote the last admin user. Promote another user to admin first.' 
        });
      }
    }

    // Prevent users from demoting themselves
    if (user.id === req.user.id && role !== 'admin') {
      return res.status(400).json({ 
        error: 'You cannot demote yourself. Ask another admin to change your role.' 
        });
    }

    const success = User.updateUserRole(req.params.id, role);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to update role' });
    }

    const updatedUser = User.findById(req.params.id);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: error.message || 'Failed to update user role' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user
 */
router.delete('/users/:id', (req, res) => {
  try {
    const user = User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ 
        error: 'You cannot delete your own account. Ask another admin to do it.' 
      });
    }

    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const admins = User.getAll().filter(u => u.role === 'admin');
      if (admins.length === 1) {
        return res.status(400).json({ 
          error: 'Cannot delete the last admin user. Promote another user to admin first.' 
        });
      }
    }

    const success = User.delete(req.params.id);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to delete user' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
