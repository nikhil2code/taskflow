const express = require("express");
const router = express.Router();
const passport = require("../config/passport");
const authController = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/me", protect, authController.getMe);
router.get("/users", protect, authController.getAllUsers);

router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.patch("/change-password", protect, authController.changePassword);
router.patch("/profile", protect, authController.updateProfile);

// Pending registrations — BOD and above only
router.get("/pending-registrations", protect, authorizeRoles("admin", "bod"), authController.getPendingRegistrations);
router.patch("/approve-registration/:id", protect, authorizeRoles("admin", "bod"), authController.approveRegistration);
router.patch("/reject-registration/:id", protect, authorizeRoles("admin", "bod"), authController.rejectRegistration);

router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp", authController.verifyOTP);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"], session: false }));
router.get("/google/callback",
  passport.authenticate("google", { failureRedirect: `${process.env.CLIENT_URL}/login`, session: false }),
  authController.googleAuthSuccess
);

module.exports = router;