'use strict';
/**
 * RBAC middleware — requireRole(['ADMIN']) or requireRole(['ADMIN','STAFF'])
 * Must run AFTER verifyAdmin middleware
 */
const requireRole = (roles = []) => (req, res, next) => {
  if (!req.admin) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!roles.includes(req.admin.role?.name))
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  next();
};

module.exports = { requireRole };
