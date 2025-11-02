const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  console.log("authenticate middleware - authHeader:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("authenticate: missing or malformed Authorization header");
    return res.status(401).json({ message: "Unauthorized: Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    console.error("authenticate: jwt.verify error:", err && err.message ? err.message : err);
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};
