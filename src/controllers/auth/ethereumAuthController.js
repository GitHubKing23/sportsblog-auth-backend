const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const crypto = require('crypto');

/**
 * @desc    Generates a cryptographic nonce tied to a given Ethereum address.
 *          This nonce must be signed by the user to prove ownership of the wallet.
 * @route   POST /auth/ethereum/nonce
 * @access  Public
 */
const getNonce = async (req, res) => {
  const { ethereumAddress } = req.body;

  // Ensure Ethereum address is provided
  if (!ethereumAddress) {
    return res.status(400).json({ error: 'Ethereum address is required' });
  }

  try {
    // Look for an existing user with the Ethereum address
    let user = await User.findOne({ ethereumAddress });

    // Generate a unique 16-byte nonce to be signed
    const nonce = crypto.randomBytes(16).toString('hex');

    if (!user) {
      // If user doesn't exist, create a new one with the nonce
      user = new User({
        ethereumAddress,
        nonce,
        authMethods: ['ethereum'],
        roles: ['Commenter'] // Default role: only comment
      });
    } else {
      // If user exists, just update the nonce
      user.nonce = nonce;
    }

    // Save new or updated user with nonce
    await user.save();

    // Return the nonce to the frontend for signing
    return res.status(200).json({ nonce });
  } catch (error) {
    console.error('❌ Error generating nonce:', error);
    return res.status(500).json({ error: 'Internal server error while generating nonce' });
  }
};

/**
 * @desc    Verifies the signed nonce to authenticate the Ethereum wallet owner.
 *          If valid, clears the nonce and issues a JWT token for session auth.
 * @route   POST /auth/ethereum/verify
 * @access  Public
 */
const verifySignature = async (req, res) => {
  const { ethereumAddress, signature } = req.body;

  // Ensure both address and signature are present
  if (!ethereumAddress || !signature) {
    return res.status(400).json({ error: 'Ethereum address and signature are required' });
  }

  try {
    // Find the user by Ethereum address
    const user = await User.findOne({ ethereumAddress });

    // Make sure the user exists and has a nonce waiting to be verified
    if (!user || !user.nonce) {
      return res.status(400).json({ error: 'Invalid or expired Ethereum login attempt' });
    }

    // Reconstruct the signed message using the stored nonce
    const message = `Sign this message to log in: ${user.nonce}`;

    // Use ethers.js to recover the address from the signature
    const recoveredAddress = ethers.verifyMessage(message, signature);

    // Compare recovered address with the provided address
    if (recoveredAddress.toLowerCase() !== ethereumAddress.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature - verification failed' });
    }

    // Signature is valid — clear the nonce so it can't be reused
    user.nonce = null;
    await user.save();

    // Create a JWT token that includes the user ID and roles
    const token = jwt.sign(
      {
        userId: user._id,
        ethereumAddress: user.ethereumAddress,
        roles: user.roles
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token valid for 1 hour
    );

    // Return the JWT to the client for session handling
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
