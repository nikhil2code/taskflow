const Task = require("../models/taskModel");
const Notification = require("../models/notificationModel");

// @POST /api/tasks
const createTask = async (req, res) => {
  const { title, description, assignedTo, deadline, priority } = req.body;

  const task = await Task.create({
    title, description, assignedTo,
    assignedBy: req.user._id,
    deadline, priority,
  });

  // Notify the assignee
  if (assignedTo) {
    await Notification.create({
      userId: assignedTo,
      message: `You have been assigned a new task: "${title}"`,
      type: "task_assigned",
      taskId: task._id,
    });
  }

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
  const { percentageCompleted } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.percentageCompleted = percentageCompleted;
  if (percentageCompleted === 100) task.status = "submitted";
  else task.status = "in_progress";

  await task.save();

  // Notify assignedBy that task was submitted
  if (percentageCompleted === 100 && task.assignedBy) {
    await Notification.create({
      userId: task.assignedBy,
      message: `Task "${task.title}" has been submitted for review`,
      type: "task_submitted",
      taskId: task._id,
    });
  }

  res.json(task);
};

// @PATCH /api/tasks/:id/approve
const approveTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.status = "approved";
  await task.save();

  // Notify assignee
  if (task.assignedTo) {
    await Notification.create({
      userId: task.assignedTo,
      message: `Your task "${task.title}" has been approved!`,
      type: "task_approved",
      taskId: task._id,
    });
  }

  res.json({ message: "Task approved", task });
};

// @PATCH /api/tasks/:id/reject
const rejectTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.status = "rejected";
  await task.save();

  // Notify assignee
  if (task.assignedTo) {
    await Notification.create({
      userId: task.assignedTo,
      message: `Your task "${task.title}" has been rejected`,
      type: "task_rejected",
      taskId: task._id,
    });
  }

  res.json({ message: "Task rejected", task });
};

// @POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  const { text } = req.body;

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.comments.push({ user: req.user._id, text });
  await task.save();

  // Notify the other party
  const notifyUserId = req.user._id.toString() === task.assignedTo?.toString()
    ? task.assignedBy
    : task.assignedTo;

  if (notifyUserId) {
    await Notification.create({
      userId: notifyUserId,
      message: `New comment on task "${task.title}"`,
      type: "comment",
      taskId: task._id,
    });
  }

  res.status(201).json(task);
};

// @DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  await task.deleteOne();
  res.json({ message: "Task deleted" });
};

module.exports = {
  createTask, getAllTasks, getMyTasks, getTaskById,
  updateProgress, approveTask, rejectTask, addComment, deleteTask,
};