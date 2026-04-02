const express = require("express");
const router = express.Router();
const {
  createTask,
  getAllTasks,
  getMyTasks,
  getTaskById,
  updateProgress,
  approveTask,
  rejectTask,
  addComment,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.post("/", protect, authorizeRoles("manager", "teamlead"), createTask);
router.get("/", protect, authorizeRoles("manager", "teamlead"), getAllTasks);
router.get("/my", protect, getMyTasks);
router.get("/:id", protect, getTaskById);
router.patch("/:id/progress", protect, authorizeRoles("employee"), updateProgress);
router.patch("/:id/approve", protect, authorizeRoles("manager", "teamlead"), approveTask);
router.patch("/:id/reject", protect, authorizeRoles("manager", "teamlead"), rejectTask);
router.post("/:id/comments", protect, addComment);
router.delete("/:id", protect, authorizeRoles("manager"), deleteTask);

module.exports = router;