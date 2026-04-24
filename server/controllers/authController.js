const User = require("../models/userModel");
const Register = require("../models/registerModel");
const { ROLE_LEVELS } = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail, sendResetEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

// ================= HELPER =================
const canAssignRole = (currentUser, targetRole) => {
  const targetLevel = ROLE_LEVELS[targetRole];
  return currentUser.roleLevel > targetLevel;
};

// ================= REGISTER =================
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phoneNo, gender } = req.body;

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
      name, email,
      password: hashedPassword,
      phoneNo, gender,
      requestedRole: role || "employee",
      status: "NEW",
    });

    res.status(201).json({
      message: "Registration request submitted. Wait for admin approval.",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ADMIN REGISTRATION =================
const getPendingRegistrations = async (req, res) => {
  try {
    const requests = await Register.find({ status: "NEW" }).sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const approveRegistration = async (req, res) => {
  try {
    const request = await Register.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.requestedRole === "admin") {
      return res.status(403).json({ message: "Cannot create admin" });
    }

    if (!canAssignRole(req.user, request.requestedRole)) {
      return res.status(403).json({ message: "Insufficient role level" });
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
      twoFactorEnabled: false,
    });

    request.status = "APPROVED";
    await request.save();

    res.json({ message: "User approved", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const request = await Register.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found" });

    request.status = "REJECTED";
    await request.save();

    res.json({ message: "Registration rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= LOGIN =================
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.accountStatus !== "ACTIVE") {
      return res.status(403).json({ message: "Account is inactive. Please contact admin." });
    }

    // 2FA enabled — send OTP
    if (user.twoFactorEnabled) {
      const otp = crypto.randomInt(100000, 999999).toString();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
      await user.save();
      await sendOTPEmail(user.email, otp);
      return res.json({ requiresTwoFactor: true, email: user.email });
    }

    const token = generateToken(user._id, user.role);

    user.sessions = user.sessions || [];
    user.sessions.push({
      deviceInfo: req.headers["user-agent"] || "Unknown device",
      ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      token,
      lastActive: new Date(),
    });
    if (user.sessions.length > 5) user.sessions = user.sessions.slice(-5);
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      twoFactorEnabled: user.twoFactorEnabled,
      token,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

// ================= VERIFY 2FA OTP =================
const verifyTwoFactor = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otp) return res.status(400).json({ message: "OTP not requested" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: "OTP expired" });

    user.otp = undefined;
    user.otpExpiry = undefined;

    const token = generateToken(user._id, user.role);
    user.sessions = user.sessions || [];
    user.sessions.push({
      deviceInfo: req.headers["user-agent"] || "2FA Login",
      ipAddress: req.ip || "N/A",
      token,
      lastActive: new Date(),
    });
    if (user.sessions.length > 5) user.sessions = user.sessions.slice(-5);
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleLevel: user.roleLevel,
      twoFactorEnabled: user.twoFactorEnabled,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= OTP LOGIN =================
const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        name: email.split("@")[0],
        email, otp, otpExpiry,
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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.otp) return res.status(400).json({ message: "No OTP requested" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: "OTP expired" });

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
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GOOGLE OAUTH =================
const googleAuthSuccess = async (req, res) => {
  try {
    const user = req.user;

    if (!user.roleLevel) {
      user.role = user.role || "employee";
      user.roleLevel = ROLE_LEVELS[user.role] || 1;
      await user.save();
    }

    if (user.accountStatus !== "ACTIVE") {
      user.accountStatus = "ACTIVE";
      user.accountApproved = true;
      await user.save();
    }

    const token = generateToken(user._id, user.role);
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error("Google auth error:", err);
    res.redirect(`${process.env.CLIENT_URL}/login`);
  }
};

// ================= FORGOT / RESET PASSWORD =================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account with that email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    await sendOTPEmail(email, null, resetURL, user.name);

    res.json({ message: "Password reset link sent to your email" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful. Please login." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= CHANGE PASSWORD =================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= UPDATE PROFILE =================
const updateProfile = async (req, res) => {
  try {
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
      gender: user.gender,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= GET ME =================
const getMe = async (req, res) => res.json(req.user);

// ================= GET ALL USERS =================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= HIERARCHY QUERIES =================
const getUsersByHierarchy = async (req, res) => {
  try {
    const users = await User.find({
      roleLevel: { $lt: req.user.roleLevel },
      _id: { $ne: req.user._id },
    }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const targetLevel = ROLE_LEVELS[role];

    if (targetLevel >= req.user.roleLevel) {
      return res.status(403).json({ message: "You can only view users with lower role levels" });
    }

    const users = await User.find({ role, _id: { $ne: req.user._id } }).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= EXPORT =================
module.exports = {
  registerUser,
  loginUser,
  verifyTwoFactor,
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