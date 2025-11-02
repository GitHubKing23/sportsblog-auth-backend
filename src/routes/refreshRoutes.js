const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

router.post("/", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token is required" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ error: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      {
        userId: user._id,
        ethereumAddress: user.ethereumAddress,
        roles: user.roles,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return res.status(200).json({ token: newAccessToken });
  } catch (err) {
    console.error("❌ Refresh token error:", err.message);
    return res.status(403).json({ error: "Invalid or expired refresh token" });
  }
});

// ✅ CORRECT EXPORT:
module.exports = router;
