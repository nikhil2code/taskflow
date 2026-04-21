const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
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
  uploadAttachment,
  deleteAttachment,
  updateTags,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


router.post("/", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), createTask);
router.get("/", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), getAllTasks);

router.get("/my", protect, getMyTasks);

router.get("/:id", protect, getTaskById);

router.patch("/:id/progress", protect, updateProgress);

router.patch("/:id/approve", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), approveTask);
router.patch("/:id/reject", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), rejectTask);

router.post("/:id/comments", protect, addComment);

router.delete("/:id", protect, authorizeRoles("admin", "bod", "manager"), deleteTask);

router.post("/:id/attachments", protect, upload.single("file"), uploadAttachment);
router.delete("/:id/attachments/:attachmentId", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), deleteAttachment);

router.patch("/:id/tags", protect, authorizeRoles("admin", "bod", "manager", "teamlead"), updateTags);

module.exports = router;