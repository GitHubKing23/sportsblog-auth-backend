const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const crypto = require('crypto');

// ✅ GET NONCE
const getNonce = async (req, res) => {
  try {
    let { ethereumAddress } = req.body;

    if (!ethereumAddress || typeof ethereumAddress !== 'string') {
      console.warn('⚠️ Missing or invalid Ethereum address:', ethereumAddress);
      return res.status(400).json({ error: 'Valid Ethereum address is required' });
    }

    ethereumAddress = ethereumAddress.trim().toLowerCase();

    // ✅ Validate format using ethers
    if (!ethers.isAddress(ethereumAddress)) {
      console.warn('⚠️ Not a valid Ethereum address format:', ethereumAddress);
      return res.status(400).json({ error: 'Invalid Ethereum address format' });
    }

    const nonce = crypto.randomBytes(16).toString('hex');

    let user = await User.findOne({ walletAddress: ethereumAddress });

    if (!user) {
      user = new User({
        walletAddress: ethereumAddress,
        nonce,
        authMethods: ['ethereum'],
        roles: ['Commenter'],
      });
    } else {
      user.nonce = nonce;
    }

    await user.save();
    return res.status(200).json({ nonce });
  } catch (error) {
    console.error('❌ Error generating nonce:', error);
    return res.status(500).json({ error: 'Internal server error while generating nonce' });
  }
};

// ✅ VERIFY SIGNATURE
const verifySignature = async (req, res) => {
  try {
    let { ethereumAddress, signature } = req.body;

    if (!ethereumAddress || !signature) {
      return res.status(400).json({ error: 'Ethereum address and signature are required' });
    }

    ethereumAddress = ethereumAddress.trim().toLowerCase();

    const user = await User.findOne({ walletAddress: ethereumAddress });

    if (!user || !user.nonce) {
      return res.status(400).json({ error: 'Invalid or expired Ethereum login attempt' });
    }

    const message = `Sign this message to log in: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== ethereumAddress) {
      return res.status(401).json({ error: 'Invalid signature - verification failed' });
    }

    user.nonce = null;
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        walletAddress: user.walletAddress,
        roles: user.roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({ token });
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return res.status(500).json({ error: 'Internal server error during signature verification' });
  }
};

module.exports = {
  getNonce,
  verifySignature
};
