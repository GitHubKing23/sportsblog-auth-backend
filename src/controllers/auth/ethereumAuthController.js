const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const crypto = require('crypto');

// Read an allowed CMS address from env. If a user logs in with this address
// they will be assigned the 'CMS' role so downstream services (the CMS)
// can be authorized accordingly.
const CMS_ETH_ADDRESS = process.env.CMS_ETH_ADDRESS || null;
/**
 * @desc    Generates a cryptographic nonce tied to a given Ethereum address.
 * @route   POST /auth/ethereum/nonce
 * @access  Public
 */
const getNonce = async (req, res) => {
  const { ethereumAddress } = req.body;

  if (!ethereumAddress) {
    return res.status(400).json({ error: 'Ethereum address is required' });
  }

  try {
    let user = await User.findOne({ ethereumAddress });
    const nonce = crypto.randomBytes(16).toString('hex');

    // If this Ethereum address matches the configured CMS address, give it the
    // 'CMS' role. Otherwise default to a normal 'Commenter' role on first create.
    if (!user) {
      const initialRoles = (CMS_ETH_ADDRESS && ethereumAddress.toLowerCase() === CMS_ETH_ADDRESS.toLowerCase())
        ? ['CMS']
        : ['Commenter'];

      user = new User({
        ethereumAddress,
        nonce,
        authMethods: ['ethereum'],
        roles: initialRoles
      });
    } else {
      user.nonce = nonce;
      // Ensure existing CMS user keeps the CMS role if configured
      if (CMS_ETH_ADDRESS && ethereumAddress.toLowerCase() === CMS_ETH_ADDRESS.toLowerCase()) {
        if (!user.roles || !user.roles.includes('CMS')) {
          user.roles = Array.from(new Set([...(user.roles || []), 'CMS']));
        }
      }
    }

    await user.save();
    return res.status(200).json({ nonce });
  } catch (error) {
    console.error('❌ Error generating nonce:', error);
    return res.status(500).json({ error: 'Internal server error while generating nonce' });
  }
};

/**
 * @desc    Verifies the signed nonce and issues access + refresh tokens.
 * @route   POST /auth/ethereum/verify
 * @access  Public
 */
const verifySignature = async (req, res) => {
  const { ethereumAddress, signature } = req.body;

  if (!ethereumAddress || !signature) {
    return res.status(400).json({ error: 'Ethereum address and signature are required' });
  }

  try {
    const user = await User.findOne({ ethereumAddress });

    if (!user || !user.nonce) {
      return res.status(400).json({ error: 'Invalid or expired Ethereum login attempt' });
    }

    const message = `Sign this message to log in: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== ethereumAddress.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature - verification failed' });
    }

    user.nonce = null;

    // If this ethereum address is the configured CMS address, ensure the user
    // has the CMS role before issuing tokens.
    if (CMS_ETH_ADDRESS && ethereumAddress.toLowerCase() === CMS_ETH_ADDRESS.toLowerCase()) {
      if (!user.roles || !user.roles.includes('CMS')) {
        user.roles = Array.from(new Set([...(user.roles || []), 'CMS']));
      }
    }

    // Generate refresh token (valid 30 days)
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '30d' }
    );

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Generate access token (short-lived)
    const accessToken = jwt.sign(
      {
        userId: user._id,
        ethereumAddress: user.ethereumAddress,
        roles: user.roles,
        username: user.username || 'Anonymous'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return res.status(500).json({ error: 'Internal server error during signature verification' });
  }
};

/**
 * @desc    Issues new access token from valid refresh token
 * @route   POST /auth/ethereum/refresh
 * @access  Public
 */
const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign(
      {
        userId: user._id,
        ethereumAddress: user.ethereumAddress,
        roles: user.roles,
        username: user.username || 'Anonymous'
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    console.error('❌ Refresh token error:', err);
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};

module.exports = {
  getNonce,
  verifySignature,
  refreshAccessToken
};