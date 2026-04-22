const Task = require("../models/taskModel");
const Notification = require("../models/notificationModel");
const { cloudinary } = require("../config/cloudinary");
const { canAssignTask } = require("../middleware/roleMiddleware"); // FIXED PATH
const User = require("../models/userModel");

// Helper to emit real-time task update to all managers
const emitTaskUpdate = async (io, task) => {
  if (!io) return;
  const populated = await Task.findById(task._id)
    .populate("assignedTo", "name email role")
    .populate("assignedBy", "name email role")
    .populate("comments.user", "name");
  io.emit("task:updated", populated);
};

// @POST /api/tasks
const createTask = async (req, res) => {
  const io = req.app.get("io");
  const { title, description, assignedTo, deadline, priority, tags, dependsOn } = req.body;

  if(assignedTo){
    const assignee = await User.findById(assignedTo);
    if (!assignee) return res.status(404).json({ message: "Assignee not found" });
    if(!canAssignTask(req.user, assignee)){
      return res.status(403).json({
        message:"you can only assign tasks to user with lower role level",
      });
      }
  }

  const task = await Task.create({
    title, description, assignedTo,
    assignedBy: req.user._id,
    createBy: req.user._id,
    updatedBy: req.user._id,
    deadline, priority,
    tags: tags || [],
    dependsOn: dependsOn || [],
  });

  if (assignedTo) {
    await Notification.create({
      userId: assignedTo,
      message: `You have been assigned a new task: "${title}"`,
      type: "task_assigned",
      taskId: task._id,
    });
    // Notify assignee in real time
    io.to(assignedTo.toString()).emit("notification:new", {
      message: `You have been assigned a new task: "${title}"`,
    });
  }

  await emitTaskUpdate(io, task);
  res.status(201).json(task);
};

// @GET /api/tasks
const getAllTasks = async (req, res) => {
  const tasks = await Task.find()
    .populate("assignedTo", "name email role")
    .populate("assignedBy", "name email role");
  res.json(tasks);
};

// @GET /api/tasks/my
const getMyTasks = async (req, res) => {
  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate("assignedBy", "name email role");
  res.json(tasks);
};

// @GET /api/tasks/:id
const getTaskById = async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate("assignedTo", "name email role")
    .populate("assignedBy", "name email role")
    .populate("comments.user", "name");
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
};

// @PATCH /api/tasks/:id/progress
const updateProgress = async (req, res) => {
  try {
    const io = req.app.get("io");
    const { percentageCompleted } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.percentageCompleted = percentageCompleted;
    if (percentageCompleted === 100) task.status = "submitted";
    else task.status = "in_progress";

    await task.save();

    if (task.assignedBy) {
      await Notification.create({
        userId: task.assignedBy,
        message: `Task "${task.title}" progress updated to ${percentageCompleted}%`,
        type: "task_submitted",
        taskId: task._id,
      });
      io.to(task.assignedBy.toString()).emit("notification:new", {
        message: `Task "${task.title}" progress updated to ${percentageCompleted}%`,
      });
    }

    await emitTaskUpdate(io, task);
    res.json(task);

  } catch (err) {
    console.error("updateProgress error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @PATCH /api/tasks/:id/approve
const approveTask = async (req, res) => {
  const io = req.app.get("io");
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.status = "approved";
  await task.save();

  if (task.assignedTo) {
    await Notification.create({
      userId: task.assignedTo,
      message: `Your task "${task.title}" has been approved!`,
      type: "task_approved",
      taskId: task._id,
    });
    io.to(task.assignedTo.toString()).emit("notification:new", {
      message: `Your task "${task.title}" has been approved!`,
    });
  }

  await emitTaskUpdate(io, task);
  res.json({ message: "Task approved", task });
};

// @PATCH /api/tasks/:id/reject
const rejectTask = async (req, res) => {
  const io = req.app.get("io");
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.status = "rejected";
  await task.save();

  if (task.assignedTo) {
    await Notification.create({
      userId: task.assignedTo,
      message: `Your task "${task.title}" has been rejected`,
      type: "task_rejected",
      taskId: task._id,
    });
    io.to(task.assignedTo.toString()).emit("notification:new", {
      message: `Your task "${task.title}" has been rejected`,
    });
  }

  await emitTaskUpdate(io, task);
  res.json({ message: "Task rejected", task });
};

// @POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  const io = req.app.get("io");
  const { text, mentions } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.comments.push({
    user: req.user._id,
    text,
    mentions: mentions || [],
  });
  await task.save();

  // Notify the other party
  const notifyUserId =
    req.user._id.toString() === task.assignedTo?.toString()
      ? task.assignedBy
      : task.assignedTo;

  if (notifyUserId) {
    await Notification.create({
      userId: notifyUserId,
      message: `💬 New comment on task "${task.title}"`,
      type: "comment",
      taskId: task._id,
    });
    io.to(notifyUserId.toString()).emit("notification:new", {
      message: `💬 New comment on task "${task.title}"`,
    });
  }

  // Notify mentioned users
  if (mentions && mentions.length > 0) {
    for (const mentionedId of mentions) {
      if (
        mentionedId.toString() !== req.user._id.toString() &&
        mentionedId.toString() !== notifyUserId?.toString()
      ) {
        await Notification.create({
          userId: mentionedId,
          message: `🔔 ${req.user.name} mentioned you in task "${task.title}"`,
          type: "comment",
          taskId: task._id,
        });
        io.to(mentionedId.toString()).emit("notification:new", {
          message: `🔔 ${req.user.name} mentioned you in "${task.title}"`,
        });
      }
    }
  }

  await emitTaskUpdate(io, task);
  res.status(201).json(task);
};

// @DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  const io = req.app.get("io");
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  await task.deleteOne();
  io.emit("task:deleted", req.params.id);
  res.json({ message: "Task deleted" });
};

// @POST /api/tasks/:id/attachments
const uploadAttachment = async (req, res) => {
  const io = req.app.get("io");
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    task.attachments.push({
      url: req.file.path,
      filename: req.file.originalname,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
    });

    await task.save();

    // Notify manager in real time
    if (task.assignedBy) {
      io.to(task.assignedBy.toString()).emit("notification:new", {
        message: `File uploaded on task "${task.title}"`,
      });
    }

    await emitTaskUpdate(io, task);
    res.status(201).json(task);
  } catch (err) {
    console.error("Upload error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

// @DELETE /api/tasks/:id/attachments/:attachmentId
const deleteAttachment = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) return res.status(404).json({ message: "Attachment not found" });

  const publicId = attachment.url.split("/").pop().split(".")[0];
  await cloudinary.uploader.destroy(`taskflow/${publicId}`);

  attachment.deleteOne();
  await task.save();
  res.json(task);
};

// @PATCH /api/tasks/:id/tags
const updateTags = async (req, res) => {
  const { tags } = req.body;
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.tags = tags;
  await task.save();
  res.json(task);
};

module.exports = {
  createTask, getAllTasks, getMyTasks, getTaskById,
  updateProgress, approveTask, rejectTask, addComment, deleteTask,
  uploadAttachment, deleteAttachment, updateTags,
};