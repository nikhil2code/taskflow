const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token received:", token); // debug line

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded:", decoded); // debug line

      req.user = await User.findById(decoded.id).select("-password");
      console.log("User found:", req.user); // debug line

      return next();
    } catch (error) {
      console.error("Token error:", error.message); // debug line
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token" });
};

module.exports = { protect };