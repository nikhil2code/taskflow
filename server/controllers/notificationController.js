const Notification = require("../models/notificationModel");

// @GET /api/notifications — get my notifications
const getNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 });
  res.json(notifications);
};

// @PATCH /api/notifications/:id/read — mark one as read
const markAsRead = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return res.status(404).json({ message: "Not found" });

  notification.isRead = true;
  await notification.save();
  res.json(notification);
};

// @PATCH /api/notifications/read-all — mark all as read
const markAllAsRead = async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: "All marked as read" });
};

module.exports = { getNotifications, markAsRead, markAllAsRead };