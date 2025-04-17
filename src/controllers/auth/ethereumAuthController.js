import User from '../../models/User.js';
import jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import crypto from 'crypto';

// ✅ GET NONCE
const getNonce = async (req, res) => {
  try {
    let { ethereumAddress } = req.body;

    if (!ethereumAddress || typeof ethereumAddress !== 'string' || ethereumAddress.trim() === '') {
      console.warn('⚠️ Missing or invalid Ethereum address');
      return res.status(400).json({ error: 'Valid Ethereum address is required' });
    }

    ethereumAddress = ethereumAddress.trim().toLowerCase();

    const nonce = crypto.randomBytes(16).toString('hex');

    let user = await User.findOne({ ethereumAddress });

    if (!user) {
      user = new User({
        ethereumAddress,
        nonce,
        authMethods: ['ethereum'],
        roles: ['Commenter'],
      });
    } else {
      if (!user.authMethods.includes('ethereum')) {
        user.authMethods.push('ethereum');
      }
      user.nonce = nonce;
    }

    await user.save();
    console.log(`✅ Nonce generated for: ${ethereumAddress}`);
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

    const user = await User.findOne({ ethereumAddress });

    if (!user || !user.nonce) {
      return res.status(400).json({ error: 'Invalid or expired Ethereum login attempt' });
    }

    const message = `Sign this message to log in: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== ethereumAddress) {
      return res.status(401).json({ error: 'Invalid signature - verification failed' });
    }

    // Invalidate nonce to prevent replay
    user.nonce = null;
    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
        ethereumAddress: user.ethereumAddress,
        roles: user.roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log(`✅ Signature verified for: ${ethereumAddress}`);
    return res.status(200).json({ token });
  } catch (error) {
    console.error('❌ Signature verification failed:', error);
    return res.status(500).json({ error: 'Internal server error during signature verification' });
  }
};

export { getNonce, verifySignature };