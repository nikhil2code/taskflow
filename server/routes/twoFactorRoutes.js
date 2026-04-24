const express = require("express");
const router = express.Router();
const {
  setup2FA,
  verifyAndEnable2FA,
  disable2FA,
  validate2FA,
  getSessions,
  deleteSession,
  deleteAllSessions,
} = require("../controllers/twoFactorController");
const { protect } = require("../middleware/authMiddleware");

router.post("/setup", protect, setup2FA);
router.post("/verify-setup", protect, verifyAndEnable2FA);
router.post("/disable", protect, disable2FA);
router.post("/validate", validate2FA);
router.get("/sessions", protect, getSessions);
router.delete("/sessions/:sessionId", protect, deleteSession);
router.delete("/sessions", protect, deleteAllSessions);

module.exports = router;