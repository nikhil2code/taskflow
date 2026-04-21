const Task = require("../models/taskModel");
const User = require("../models/userModel");

// @GET /api/analytics/overview
const getOverview = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const totalUsers = await User.countDocuments({ role: { $ne: "admin" } });

    const statusCounts = await Task.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const priorityCounts = await Task.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } }
    ]);

    const overdueTasks = await Task.countDocuments({
      deadline: { $lt: new Date() },
      status: { $nin: ["approved"] },
    });

    res.json({
      totalTasks,
      totalUsers,
      overdueTasks,
      statusCounts,
      priorityCounts,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/analytics/tasks-per-week
const getTasksPerWeek = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const tasks = await Task.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Fill missing days with 0
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const found = tasks.find(t => t._id === dateStr);
      result.push({
        date: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
        tasks: found ? found.count : 0,
      });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/analytics/employee-performance
const getEmployeePerformance = async (req, res) => {
  try {
    const performance = await Task.aggregate([
      { $match: { assignedTo: { $exists: true } } },
      {
        $group: {
          _id: "$assignedTo",
          total: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          },
          rejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
          },
          avgProgress: { $avg: "$percentageCompleted" },
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $project: {
          name: "$user.name",
          role: "$user.role",
          total: 1,
          approved: 1,
          rejected: 1,
          inProgress: 1,
          avgProgress: { $round: ["$avgProgress", 1] },
          completionRate: {
            $round: [
              { $multiply: [{ $divide: ["$approved", { $max: ["$total", 1] }] }, 100] },
              1
            ]
          }
        }
      },
      { $sort: { completionRate: -1 } }
    ]);

    res.json(performance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @GET /api/analytics/activity-log
const getActivityLog = async (req, res) => {
  try {
    const recentTasks = await Task.find()
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate("assignedTo", "name role")
      .populate("assignedBy", "name role")
      .populate("updatedBy", "name role");

    const log = recentTasks.map(task => ({
      _id: task._id,
      title: task.title,
      status: task.status,
      percentageCompleted: task.percentageCompleted,
      assignedTo: task.assignedTo,
      assignedBy: task.assignedBy,
      updatedBy: task.updatedBy,
      updatedAt: task.updatedAt,
      priority: task.priority,
    }));

    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getOverview,
  getTasksPerWeek,
  getEmployeePerformance,
  getActivityLog,
};