const express = require("express");
const router = express.Router();
const {
  getOverview,
  getTasksPerWeek,
  getEmployeePerformance,
  getActivityLog,
} = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// Analytics — TeamLead and above
router.get("/overview", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), getOverview);
router.get("/tasks-per-week", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), getTasksPerWeek);
router.get("/employee-performance", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), getEmployeePerformance);
router.get("/activity-log", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), getActivityLog);
module.exports = router;