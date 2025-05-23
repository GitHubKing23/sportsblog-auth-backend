const express = require('express');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const User = require('../models/User');

const router = express.Router();

// ✅ Health Check Route
router.get('/health', (req, res) => {
  res.json({ status: "Ethereum Auth API is healthy ✅" });
});

// ✅ Generate Nonce for Signing
router.post('/nonce', async (req, res) => {
  try {
    const { ethereumAddress } = req.body;

    if (!ethereumAddress || typeof ethereumAddress !== 'string') {
      return res.status(400).json({ message: "⚠️ Ethereum address is required and must be a string." });
    }

    let user = await User.findOne({ ethereumAddress });

    if (!user) {
      user = new User({
        ethereumAddress,
        nonce: Math.floor(Math.random() * 1000000).toString(),
        authMethods: ['ethereum'],
      });
      await user.save();
    } else {
      if (!user.authMethods.includes('ethereum')) {
        user.authMethods.push('ethereum');
      }
      user.nonce = Math.floor(Math.random() * 1000000).toString();
      await user.save();
    }

    res.json({ nonce: user.nonce });
  } catch (error) {
    console.error("❌ Nonce Generation Error:", error);
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
});

// ✅ Authenticate User via Exact Message Verification
router.post('/verify', async (req, res) => {
  try {
    const { ethereumAddress, signature, message } = req.body;

    if (!ethereumAddress || !signature || !message) {
      return res.status(400).json({ message: "⚠️ Missing Ethereum address, signature, or message." });
    }

    const user = await User.findOne({ ethereumAddress });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
      console.log(`✅ Verified with exact message.`);
      console.log(`➡️ Recovered: ${recoveredAddress}`);
      console.log(`➡️ Expected:  ${ethereumAddress}`);
    } catch (err) {
      console.error("❌ Signature verification failed:", err.message);
      return res.status(401).json({ message: "Signature verification failed." });
    }

    if (recoveredAddress.toLowerCase() !== ethereumAddress.toLowerCase()) {
      console.error(`❌ Address mismatch! Recovered: ${recoveredAddress}, Expected: ${ethereumAddress}`);
      return res.status(401).json({ message: "Recovered address mismatch." });
    }

    const token = jwt.sign(
      { id: user._id, ethereumAddress: user.ethereumAddress },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    user.nonce = null;
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        ethereumAddress: user.ethereumAddress,
      },
    });
  } catch (error) {
    console.error("❌ Web3 Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
});

// ✅ Get Authenticated User Profile
router.get('/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-nonce');
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      ethereumAddress: user.ethereumAddress,
      authMethods: user.authMethods
    });
  } catch (err) {
    console.error("❌ Profile token error:", err.message);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
