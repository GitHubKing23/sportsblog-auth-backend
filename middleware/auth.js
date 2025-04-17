const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");
const User = require("../models/User"); // Adjust the path to where your User model is located

// Middleware to authenticate using Ethereum wallet (MetaMask or other)
const authenticateEthereum = async (req, res, next) => {
  try {
    const { address, signature } = req.body;

    if (!address || !signature) {
      return res.status(400).json({ message: "Address and signature are required" });
    }

    const user = await User.findOne({ walletAddress: address });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate message to sign, it can be something like a nonce for security
    const message = `Sign this message to authenticate. Nonce: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ message: "Signature verification failed" });
    }

    // Generate JWT token upon successful signature verification
    const token = jwt.sign(
      { id: user._id, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Set your preferred expiration time
    );

    // Attach the JWT token to the response for future use (e.g., store in localStorage)
    res.json({
      token,
      user: { id: user._id, walletAddress: user.walletAddress }
    });
  } catch (error) {
    console.error("❌ Error in Ethereum authentication:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Middleware to authenticate using JWT token (for protected routes)
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden: Invalid or expired token" });
    }

    req.user = user; // Attach user info to the request object
    next();
  });
};

module.exports = { authenticateEthereum, authenticateJWT };
