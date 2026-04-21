const User = require("../models/userModel");
const Register = require("../models/registerModel");
const { ROLE_LEVELS } = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Helper function for role level checking
const canAssignRole = (currentUser, targetRole) => {
  const targetLevel = ROLE_LEVELS[targetRole];
  return currentUser.roleLevel > targetLevel;
};

// ================= REGISTER (UPDATED FLOW) =================

// @POST /api/auth/register — stores request instead of creating user
const registerUser = async (req, res) => {
  const { name, email, password, role, phoneNo, gender } = req.body;

  // Prevent admin registration
  if (role === "admin") {
    return res.status(403).json({ message: "Cannot register as admin" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const existingRequest = await Register.findOne({ email });
  if (existingRequest) {
    return res.status(400).json({ message: "Registration request already pending" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  await Register.create({
    name,
    email,
    password: hashedPassword,
    phoneNo,
    gender,
    requestedRole: role || "employee",
    status: "NEW",
  });

  res.status(201).json({
    message: "Registration request submitted. Wait for admin approval.",
  });
};

// ================= ADMIN REGISTRATION CONTROL =================

// @GET /api/auth/pending-registrations — admin only
const getPendingRegistrations = async (req, res) => {
  const requests = await Register.find({ status: "NEW" }).sort({ createdAt: -1 });
  res.json(requests);
};

// @PATCH /api/auth/approve-registration/:id
const approveRegistration = async (req, res) => {
  const request = await Register.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  // Safety: block admin creation
  if (request.requestedRole === "admin") {
    return res.status(403).json({ message: "Cannot create admin via registration" });
  }

  // HIERARCHY CHECK: Can the current admin assign this role?
  if (!canAssignRole(req.user, request.requestedRole)) {
    return res.status(403).json({
      message: `Your role level (${req.user.roleLevel}) is insufficient to approve a user with role '${request.requestedRole}' (Level: ${ROLE_LEVELS[request.requestedRole]})`
    });
  }

  const user = await User.create({
    name: request.name,
    email: request.email,
    password: request.password,
    phoneNo: request.phoneNo,
    gender: request.gender,
    role: request.requestedRole,
    roleLevel: ROLE_LEVELS[request.requestedRole],
    accountApproved: true,
    accountStatus: "ACTIVE",
  });

  request.status = "APPROVED";
  await request.save();

  res.json({
    message: `${request.name} approved as ${request.requestedRole}`,
    user,
  });
};

// @PATCH /api/auth/reject-registration/:id
const rejectRegistration = async (req, res) => {
  const request = await Register.findById(req.params.id);
  if (!request) {
    return res.status(404).json({ message: "Request not found" });
  }

  request.status = "REJECTED";
  await request.save();

  res.json({ message: "Registration rejected" });
};

// ================= EXISTING AUTH =================

// @POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    // Check if account is active
    if (user.accountStatus !== "ACTIVE") {
      return res.status(403).json({ message: "Account is inactive. Please contact admin." });
    }
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
};

// @GET /api/auth/me
const getMe = async (req, res) => {
  res.json(req.user);
};

// @GET /api/auth/users
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// ================= OTP =================

const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      name: email.split("@")[0],
      email,
      otp,
      otpExpiry,
      authMethod: "otp",
      role: "employee",
      roleLevel: ROLE_LEVELS["employee"],
      accountApproved: true,
      accountStatus: "ACTIVE",
    });
  } else {
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
  }

  await sendOTPEmail(email, otp);
  res.json({ message: "OTP sent to your email" });
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.otp) {
    return res.status(400).json({ message: "No OTP requested" });
  }

  if (user.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ message: "OTP expired" });
  }

  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLevel: user.roleLevel,
    token: generateToken(user._id, user.role),
  });
};

// ================= GOOGLE OAUTH =================

const googleAuthSuccess = async (req, res) => {
  try {
    const user = req.user;
    
    // Make sure user has all required fields
    if (!user.roleLevel) {
      user.role = user.role || "employee";
      user.roleLevel = ROLE_LEVELS[user.role] || 1;
      await user.save();
    }
    
    if (user.accountStatus !== 'ACTIVE') {
      user.accountStatus = 'ACTIVE';
      user.accountApproved = true;
      await user.save();
    }
    
    const token = generateToken(user._id, user.role);
    
    // Redirect to frontend auth success page with token
    res.redirect(`${process.env.CLIENT_URL}/auth/success?token=${token}`);
  } catch (error) {
    console.error('Google auth error:', error);
    res.redirect(`${process.env.CLIENT_URL}/auth/success?error=google_auth_failed`);
  }
};

// ================= PASSWORD RESET =================

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  await user.save();
  
  res.json({ 
    message: "Password reset email sent",
    resetToken
  });
};

const resetPassword = async (req, res) => {
  const resetPasswordToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
  
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });
  
  if (!user) {
    return res.status(400).json({ message: "Invalid or expired token" });
  }
  
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(req.body.password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  
  res.json({ message: "Password reset successful" });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  
  if (!(await user.matchPassword(currentPassword))) {
    return res.status(401).json({ message: "Current password is incorrect" });
  }
  
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();
  
  res.json({ message: "Password changed successfully" });
};

const updateProfile = async (req, res) => {
  const { name, phoneNo, gender } = req.body;
  const user = await User.findById(req.user._id);
  
  if (name) user.name = name;
  if (phoneNo) user.phoneNo = phoneNo;
  if (gender) user.gender = gender;
  
  await user.save();
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLevel: user.roleLevel,
    phoneNo: user.phoneNo,
    gender: user.gender
  });
};

// ================= HIERARCHY-BASED USER MANAGEMENT =================

// @GET /api/auth/users/hierarchy
const getUsersByHierarchy = async (req, res) => {
  try {
    // Get users lower than current user's role level
    const users = await User.find({ 
      roleLevel: { $lt: req.user.roleLevel },
      _id: { $ne: req.user._id }
    }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @GET /api/auth/users/role/:role
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const targetLevel = ROLE_LEVELS[role];
    
    // Only allow viewing roles lower than current user's level
    if (targetLevel >= req.user.roleLevel) {
      return res.status(403).json({ 
        message: "You can only view users with lower role levels" 
      });
    }
    
    const users = await User.find({ role, _id: { $ne: req.user._id } }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= EXPORT ALL FUNCTIONS =================

module.exports = {
  registerUser,
  loginUser,
  getMe,
  getAllUsers,
  sendOTP,
  verifyOTP,
  googleAuthSuccess,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  getUsersByHierarchy,
  getUsersByRole,
};