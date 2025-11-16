const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/me', authMiddleware, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

router.get('/admin/ping', authMiddleware, adminOnly, (req, res) => {
  return res.json({ ok: true, message: 'Admin endpoint reached.' });
});

module.exports = router;