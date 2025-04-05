import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import User from '../models/User.js';

dotenv.config();
const router = express.Router();

// ✅ Generate Nonce for Signing
router.post('/get-nonce', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address || typeof address !== 'string') {
      return res.status(400).json({ message: "⚠️ Wallet address is required and must be a string." });
    }

    let user = await User.findOne({ walletAddress: address });

    if (!user) {
      user = new User({
        walletAddress: address,
        nonce: Math.floor(Math.random() * 1000000),
      });
      await user.save();
    } else {
      user.nonce = Math.floor(Math.random() * 1000000);
      await user.save();
    }

    res.json({ nonce: user.nonce });
  } catch (error) {
    console.error("❌ Nonce Generation Error:", error);
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
});

// ✅ Authenticate User via Signature Verification
router.post('/web3-login', async (req, res) => {
  try {
    const { address, signature } = req.body;

    if (!address || !signature) {
      return res.status(400).json({ message: "⚠️ Missing wallet address or signature." });
    }

    const user = await User.findOne({ walletAddress: address });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const message = `Sign this message to authenticate. Nonce: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ message: "Signature verification failed." });
    }

    // ✅ Generate JWT
    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // 🛡️ Reset nonce after login
    user.nonce = Math.floor(Math.random() * 1000000);
    await user.save();

    res.json({
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("❌ Web3 Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message || error });
  }
});

export default router;
