const express = require('express');
const router = express.Router();

const {
  getNonce,
  verifySignature
} = require('../controllers/auth/ethereumAuthController');

router.post('/nonce', getNonce);
router.post('/verify', verifySignature);

module.exports = router;
