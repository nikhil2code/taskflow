const express = require("express");
const router = express.Router();
const { sendInvite, acceptInvite } = require("../controllers/inviteController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Invites — BOD and above only
router.post("/", protect, authorizeRoles("admin", "bod"), sendInvite);
router.post("/accept/:token", acceptInvite);

module.exports = router;