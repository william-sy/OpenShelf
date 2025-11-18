/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides middleware functions to protect routes based on user roles.
 * Roles: admin, reader
 * 
 * - admin: Full access (create, read, update, delete)
 * - reader: Read-only access (can view but not modify)
 */

/**
 * Middleware to require admin role
 * Use this to protect routes that should only be accessible to admins
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.',
      requiredRole: 'admin',
      currentRole: req.user.role
    });
  }

  next();
}

/**
 * Middleware to require specific role(s)
 * @param {string|string[]} roles - Single role or array of allowed roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const allowedRoles = roles.flat();
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        requiredRoles: allowedRoles,
        currentRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware to check if user is admin
 * Adds isAdmin boolean to request object, doesn't block the request
 */
export function checkAdmin(req, res, next) {
  req.isAdmin = req.user && req.user.role === 'admin';
  next();
}

/**
 * Middleware to require admin or user role (can modify items)
 * Use this to protect routes where users can add/edit/delete items
 */
export function requireAdminOrUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'user') {
    return res.status(403).json({ 
      error: 'Access denied. You need admin or user privileges to perform this action.',
      requiredRoles: ['admin', 'user'],
      currentRole: req.user.role
    });
  }

  next();
}

/**
 * Middleware to check if user can modify (admin or user role)
 * Adds canModify boolean to request object, doesn't block the request
 */
export function checkModifyPermission(req, res, next) {
  req.canModify = req.user && (req.user.role === 'admin' || req.user.role === 'user');
  next();
}
