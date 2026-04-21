const User = require("../models/userModel");
const Register = require("../models/registerModel");
const { ROLE_LEVELS } = require("../models/userModel");

// Helper function to check if user can assign role
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

// @GET /api/admin/pending-registrations
const getPendingRegistrations = async (req, res) => {
  try {
    const pending = await Register.find({ status: "NEW" }).sort({ createdAt: -1 });
    res.json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/admin/all-users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/admin/approve-registration/:id
const approveRegistration = async (req, res) => {
  try {
    const request = await Register.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Registration request not found" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: request.email });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Check if admin can assign this role
    if (!canAssignRole(req.user, request.requestedRole)) {
      return res.status(403).json({
        message: `Your role level (${req.user.roleLevel}) is insufficient to approve role '${request.requestedRole}'`
      });
    }

    // Create user
    const newUser = await User.create({
      name: request.name,
      email: request.email,
      password: request.password,
      phoneNo: request.phoneNo,
      gender: request.gender,
      role: request.requestedRole,
      roleLevel: ROLE_LEVELS[request.requestedRole],
      accountApproved: true,
      accountStatus: "ACTIVE",
      isActive: true
    });

    // Update request status
    request.status = "APPROVED";
    await request.save();

    res.json({
      success: true,
      message: `${request.name} approved as ${request.requestedRole}`,
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/admin/reject-registration/:id
const rejectRegistration = async (req, res) => {
  try {
    const request = await Register.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Registration request not found" });
    }

    request.status = "REJECTED";
    await request.save();

    res.json({
      success: true,
      message: `Registration request for ${request.email} rejected`
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/admin/users/:id/role
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findById(req.params.id);
    
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent modifying admin
    if (targetUser.role === "admin") {
      return res.status(403).json({ message: "Cannot modify admin user" });
    }
    
    // Prevent assigning admin role
    if (role === "admin") {
      return res.status(403).json({ message: "Cannot assign admin role" });
    }
    
    // Enforce hierarchy
    if (!canAssignRole(req.user, role)) {
      return res.status(403).json({
        message: `Your role level (${req.user.roleLevel}) is insufficient to assign role '${role}'`
      });
    }
    
    // Can only modify users lower than you
    if (req.user.roleLevel <= targetUser.roleLevel) {
      return res.status(403).json({
        message: "You can only modify users with lower role level"
      });
    }
    
    targetUser.role = role;
    targetUser.roleLevel = ROLE_LEVELS[role];
    await targetUser.save();
    
    res.json({ 
      success: true,
      message: `${targetUser.name}'s role updated to ${role}`,
      user: {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        roleLevel: targetUser.roleLevel
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/admin/users/:id/deactivate
const deactivateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (targetUser.role === "admin") {
      return res.status(403).json({ message: "Cannot deactivate admin" });
    }
    
    // Can only deactivate users lower than you
    if (req.user.roleLevel <= targetUser.roleLevel) {
      return res.status(403).json({ 
        message: "You can only deactivate users with lower role level" 
      });
    }
    
    targetUser.accountStatus = "INACTIVE";
    targetUser.isActive = false;
    await targetUser.save();
    
    res.json({ 
      success: true,
      message: `${targetUser.name} deactivated successfully` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @PATCH /api/admin/users/:id/activate
const activateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Can only activate users lower than you
    if (req.user.roleLevel <= targetUser.roleLevel) {
      return res.status(403).json({ 
        message: "You can only activate users with lower role level" 
      });
    }
    
    targetUser.accountStatus = "ACTIVE";
    targetUser.isActive = true;
    await targetUser.save();
    
    res.json({ 
      success: true,
      message: `${targetUser.name} activated successfully` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (targetUser.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin" });
    }
    
    // Can only delete users lower than you
    if (req.user.roleLevel <= targetUser.roleLevel) {
      return res.status(403).json({ 
        message: "You can only delete users with lower role level" 
      });
    }
    
    await targetUser.deleteOne();
    res.json({ 
      success: true,
      message: `${targetUser.name} deleted successfully` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @POST /api/admin/invite (Send invite email)
const sendInvite = async (req, res) => {
  try {
    const { email, role } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Check if admin can assign this role
    if (!canAssignRole(req.user, role)) {
      return res.status(403).json({
        message: `Your role level is insufficient to invite user as '${role}'`
      });
    }
    
    // Generate invite token
    const crypto = require("crypto");
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Create pending registration
    await Register.create({
      name: "Invited User",
      email,
      password: "", // Will be set during registration
      requestedRole: role,
      status: "NEW",
      inviteToken,
      inviteExpiry
    });
    
    // Send invite email (implement sendInviteEmail function)
    // await sendInviteEmail(email, inviteToken);
    
    res.json({
      success: true,
      message: `Invite sent to ${email} for role ${role}`,
      inviteToken // Remove in production
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPendingRegistrations,
  getAllUsers,
  approveRegistration,
  rejectRegistration,
  updateUserRole,
  deactivateUser,
  activateUser,
  deleteUser,
  sendInvite
};