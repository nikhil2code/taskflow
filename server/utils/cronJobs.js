const cron = require("node-cron");
const Task = require("../models/taskModel");
const Notification = require("../models/notificationModel");
const { sendReminderEmail } = require("./sendEmail");

const startCronJobs = (io) => {

  // Runs every day at 9:00 AM
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running due date reminder job...");
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find tasks due tomorrow that are not approved
      const tasksDueSoon = await Task.find({
        deadline: { $gte: today, $lte: tomorrow },
        status: { $nin: ["approved"] },
        assignedTo: { $exists: true },
      }).populate("assignedTo", "name email")
        .populate("assignedBy", "name email");

      for (const task of tasksDueSoon) {
        if (!task.assignedTo) continue;

        // Create notification
        await Notification.create({
          userId: task.assignedTo._id,
          message: `⚠️ Task "${task.title}" is due tomorrow!`,
          type: "task_assigned",
          taskId: task._id,
        });

        // Real-time alert
        if (io) {
          io.to(task.assignedTo._id.toString()).emit("notification:new", {
            message: `⚠️ Task "${task.title}" is due tomorrow!`,
          });
        }

        // Send email reminder
        if (task.assignedTo.email) {
          await sendReminderEmail(
            task.assignedTo.email,
            task.assignedTo.name,
            task.title,
            task.deadline
          );
        }
      }

      console.log(`✅ Sent reminders for ${tasksDueSoon.length} tasks`);
    } catch (err) {
      console.error("❌ Cron job error:", err.message);
    }
  });

  // Overdue check — runs every day at 8:00 AM
  cron.schedule("0 8 * * *", async () => {
    console.log("⏰ Running overdue task check...");
    try {
      const now = new Date();

      const overdueTasks = await Task.find({
        deadline: { $lt: now },
        status: { $nin: ["approved", "submitted"] },
        assignedTo: { $exists: true },
      }).populate("assignedTo", "name email")
        .populate("assignedBy", "name");

      for (const task of overdueTasks) {
        if (!task.assignedTo) continue;

        // Notify assignee
        await Notification.create({
          userId: task.assignedTo._id,
          message: `🔴 Task "${task.title}" is overdue!`,
          type: "task_assigned",
          taskId: task._id,
        });

        // Notify manager
        if (task.assignedBy) {
          await Notification.create({
            userId: task.assignedBy._id,
            message: `🔴 Task "${task.title}" assigned to ${task.assignedTo.name} is overdue!`,
            type: "task_submitted",
            taskId: task._id,
          });

          if (io) {
            io.to(task.assignedBy._id.toString()).emit("notification:new", {
              message: `🔴 Task "${task.title}" is overdue!`,
            });
          }
        }

        if (io) {
          io.to(task.assignedTo._id.toString()).emit("notification:new", {
            message: `🔴 Task "${task.title}" is overdue!`,
          });
        }
      }

      console.log(`✅ Overdue check done for ${overdueTasks.length} tasks`);
    } catch (err) {
      console.error("❌ Overdue cron error:", err.message);
    }
  });
};

module.exports = startCronJobs;