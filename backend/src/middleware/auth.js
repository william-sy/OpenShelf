import jwt from 'jsonwebtoken';

// Read lazily (not at module-import time): dotenv.config() in server.js runs
// as part of that module's own body, which executes *after* this module
// (its static import) has already been evaluated - so a module-level
// `const JWT_SECRET = process.env.JWT_SECRET` would always see `undefined`
// in local dev, no matter where dotenv.config() is called from server.js.
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable must be set');
  }
  return secret;
}

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, getJwtSecret(), (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

export function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}
