import express from 'express';
import bcrypt from 'bcryptjs';
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
 * POST /api/admin/users
 * Create a new user (admin only)
 */
router.post('/users', async (req, res) => {
  try {
    const { username, email, password, displayName, role } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Validate role
    const validRoles = ['admin', 'user', 'reader'];
    const userRole = role || 'user';
    if (!validRoles.includes(userRole)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const existingEmail = User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = User.create({
      username,
      email,
      password_hash: passwordHash,
      display_name: displayName || username,
      role: userRole
    });

    if (!newUser) {
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message || 'Failed to create user' });
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
 * POST /api/admin/users/:id/reset-password
 * Reset a user's password
 */
router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const user = User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const success = User.resetUserPassword(req.params.id, passwordHash);
    
    if (!success) {
      return res.status(400).json({ error: 'Failed to reset password' });
    }

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
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
