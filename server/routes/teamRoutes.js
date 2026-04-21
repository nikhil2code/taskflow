const express = require("express");
const router = express.Router();
const { createTeam, getTeams, getTeamById, updateTeam, deleteTeam } = require("../controllers/teamController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Teams — Manager and above
router.post("/", protect, authorizeRoles("admin", "bod", "manager"), createTeam);
router.get("/", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), getTeams);
router.get("/:id", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), getTeamById);
router.patch("/:id", protect, authorizeRoles("admin", "bod", "manager"), updateTeam);
router.delete("/:id", protect, authorizeRoles("admin", "bod", "manager"), deleteTeam);

module.exports = router;
