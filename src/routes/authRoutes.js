const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  findByEmail,
  findById,
  countUsers,
  createUser,
  saveRefreshToken,
} = require('../models/User');

const router = express.Router();

const buildUserResponse = (user) => ({
  id: user.id || user._key,
  email: user.email,
  name: user.name,
  role: user.role,
});

const issueTokens = async (user) => {
  const payload = {
    userId: user.id || user._key,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
  await saveRefreshToken(payload.userId, refreshToken);

  return { accessToken, refreshToken };
};

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existing = await findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const totalUsers = await countUsers();
    const role = totalUsers === 0 ? 'admin' : 'user';
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUser({ email, passwordHash, name, role });
    const tokens = await issueTokens(user);

    return res.status(201).json({
      user: buildUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    return res.status(500).json({ error: 'Failed to register user.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const tokens = await issueTokens(user);
    return res.status(200).json({
      user: buildUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    return res.status(500).json({ error: 'Failed to log in.' });
  }
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: 'Invalid refresh token.' });
    }

    const tokens = await issueTokens(user);
    return res.status(200).json({
      user: buildUserResponse(user),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  } catch (error) {
    console.error('❌ Refresh error:', error);
    return res.status(403).json({ error: 'Invalid or expired refresh token.' });
  }
});

router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(200).json({ message: 'Logged out' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    await saveRefreshToken(decoded.userId, null);
    return res.status(200).json({ message: 'Logged out' });
  } catch (error) {
    return res.status(200).json({ message: 'Logged out' });
  }
});

module.exports = router;
