const crypto = require("crypto");
const User = require("../models/userModel");
const { sendInviteEmail } = require("../utils/sendEmail");

// @POST /api/invite
const sendInvite = async (req, res) => {
  const { email, role } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: "User already registered" });

  const inviteToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(inviteToken).digest("hex");

  await User.create({
    name: email.split("@")[0],
    email,
    role: role || "employee",
    password: crypto.randomBytes(16).toString("hex"),
    inviteToken: hashedToken,
    inviteExpiry: Date.now() + 48 * 60 * 60 * 1000,
    isActive: false,
  });

  const inviteURL = `${process.env.CLIENT_URL}/accept-invite/${inviteToken}`;
  await sendInviteEmail(email, inviteURL, req.user.name);

  res.json({ message: `Invite sent to ${email}` });
};

// @POST /api/invite/accept/:token
const acceptInvite = async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    inviteToken: hashedToken,
    inviteExpiry: { $gt: Date.now() },
  });

  if (!user) return res.status(400).json({ message: "Invalid or expired invite" });

  const { name, password } = req.body;
  user.name = name;
  user.password = password;
  user.isActive = true;
  user.inviteToken = undefined;
  user.inviteExpiry = undefined;
  await user.save();

  res.json({ message: "Account activated! Please login." });
};

module.exports = { sendInvite, acceptInvite };