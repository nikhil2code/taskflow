const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const {
  registerUser, loginUser, getMe, getAllUsers,
  sendOTP, verifyOTP, googleAuthSuccess,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMe);
router.get("/users", protect, getAllUsers);

// OTP routes
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

// Google OAuth routes
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
  googleAuthSuccess
);

module.exports = router;