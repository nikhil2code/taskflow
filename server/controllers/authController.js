const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const { sendOTPEmail } = require("../utils/sendEmail");
const crypto = require("crypto");

// @POST /api/auth/register
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: "User already exists" });

  const user = await User.create({ name, email, password, role });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } else {
    res.status(400).json({ message: "Invalid user data" });
  }
};

// @POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
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

// @POST /api/auth/send-otp
const sendOTP = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  // Generate 6-digit OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  let user = await User.findOne({ email });

  if (!user) {
    // Create a placeholder user
    user = await User.create({
      name: email.split("@")[0],
      email,
      otp,
      otpExpiry,
      authMethod: "otp",
    });
  } else {
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
  }

  await sendOTPEmail(email, otp);
  res.json({ message: "OTP sent to your email" });
};

// @POST /api/auth/verify-otp
const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.otp) {
    return res.status(400).json({ message: "No OTP requested for this email" });
  }

  if (user.otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (new Date() > user.otpExpiry) {
    return res.status(400).json({ message: "OTP has expired" });
  }

  // Clear OTP after use
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id, user.role),
  });
};

// Google OAuth success handler
const googleAuthSuccess = async (req, res) => {
  const user = req.user;
  const token = generateToken(user._id, user.role);
  // Redirect to frontend with token
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
};



// @POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "No account with that email" });

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
  await user.save();

  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  await sendOTPEmail(email, null, resetURL, user.name);
  res.json({ message: "Password reset link sent to your email" });
};

// @POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired reset link" });

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res.json({ message: "Password reset successful. Please login." });
};

// @PATCH /api/auth/change-password  (logged in user)
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);
  const isMatch = await user.matchPassword(oldPassword);
  if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

  user.password = newPassword;
  await user.save();

  res.json({ message: "Password changed successfully" });
};

// @PATCH /api/auth/profile  (update name)
const updateProfile = async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  await user.save();
  res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
};

module.exports = {
  registerUser, loginUser, getMe, getAllUsers,
  sendOTP, verifyOTP, googleAuthSuccess,
  forgotPassword, resetPassword, changePassword, updateProfile,
};