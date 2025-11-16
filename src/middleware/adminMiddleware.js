function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: Admin access required' });
  }

  return next();
}

module.exports = adminOnly;
