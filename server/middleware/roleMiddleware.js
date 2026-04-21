const { ROLE_LEVELS } = require("../models/userModel");
const User = require("../models/userModel");

// Basic role check
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not authorized`,
      });
    }
    next();
  };
};

// Hierarchy check — current user must outrank target user
const hierarchyCheck = async (req, res, next) => {
  try {
    const targetId = req.params.id || req.body.userId;
    if (!targetId) return next();

    const targetUser = await User.findById(targetId);
    if (!targetUser) return res.status(404).json({ message: "Target user not found" });

    if (req.user.roleLevel <= targetUser.roleLevel) {
      return res.status(403).json({
        message: "You cannot perform actions on a user of equal or higher rank",
      });
    }
    req.targetUser = targetUser;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Task update check — only creator or higher hierarchy
const taskUpdateCheck = (TaskModel) => async (req, res, next) => {
  try {
    const task = await TaskModel.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isCreator = task.createdBy?.toString() === req.user._id.toString();
    const isAssignedTo = task.assignedTo?.toString() === req.user._id.toString();
    const isHigherAuthority = req.user.roleLevel >= 3;

    if (!isCreator && !isAssignedTo && !isHigherAuthority) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }
    req.task = task;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Core logic helpers
const canAssignRole = (currentUser, targetRole) => {
  const roleLevels = {
    admin: 5,
    bod: 4,
    manager: 3,
    teamlead: 2,
    employee: 1
  };
  
  const targetLevel = roleLevels[targetRole];
  return currentUser.roleLevel > targetLevel;
};

const canAssignTask = (assigner, assignee) => {
  return assigner.roleLevel > assignee.roleLevel;
};

const canUpdateUser = (currentUser, targetUser) => {
  if (targetUser.role === "admin") return false;
  return currentUser.roleLevel > targetUser.roleLevel;
};

module.exports = {
  authorizeRoles,
  hierarchyCheck,
  taskUpdateCheck,
  canAssignRole,
  canAssignTask,
  canUpdateUser
};