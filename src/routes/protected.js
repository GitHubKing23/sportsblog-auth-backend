const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate'); // adjust path if different

// returns the authenticated user object (from req.user)
router.get('/test', authenticate, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

module.exports = router;