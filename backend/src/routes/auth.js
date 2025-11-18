import express from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User } from '../models/User.js';
import { ApiSettings } from '../models/ApiSettings.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Register new user
router.post('/register',
  body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('display_name').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if registration is allowed
      const registrationAllowed = ApiSettings.isRegistrationAllowed();
      if (!registrationAllowed) {
        return res.status(403).json({ error: 'New user registration is currently disabled. Please contact an administrator.' });
      }

      const { username, email, password, display_name } = req.body;

      // Check if user already exists
      if (User.findByUsername(username)) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      if (User.findByEmail(email)) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with 'user' role by default (can add/delete items, but not manage users)
      const user = User.create(username, email, passwordHash, 'user', display_name);

      // Generate token
      const token = generateToken(user);

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          profile_picture: user.profile_picture,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;

      // Find user
      const user = User.findByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          profile_picture: user.profile_picture,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  const user = User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });
});

// Change password
router.post('/change-password',
  authenticateToken,
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { currentPassword, newPassword } = req.body;
      const user = User.findById(req.user.id);

      // Verify current password
      const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      User.updatePassword(req.user.id, passwordHash);

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Password change failed' });
    }
  }
);

// Update profile
router.put('/profile',
  authenticateToken,
  body('display_name').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { display_name } = req.body;
      
      // Update user
      User.update(req.user.id, { display_name });
      
      // Get updated user
      const user = User.findById(req.user.id);

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          profile_picture: user.profile_picture,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ error: 'Profile update failed' });
    }
  }
);

// Upload profile picture
router.post('/profile-picture',
  authenticateToken,
  upload.single('image'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Construct full URL based on request
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      // Update user's profile picture
      User.update(req.user.id, { profile_picture: imageUrl });

      // Get updated user
      const user = User.findById(req.user.id);

      res.json({
        message: 'Profile picture uploaded successfully',
        url: imageUrl,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          profile_picture: user.profile_picture,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({ error: 'Failed to upload profile picture' });
    }
  }
);

export default router;
