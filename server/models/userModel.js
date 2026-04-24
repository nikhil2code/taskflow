const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ROLE_LEVELS = {
  admin: 5,
  bod: 4,
  manager: 3,
  teamlead: 2,
  employee: 1,
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phoneNo: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },

    role: {
      type: String,
      enum: ["admin", "bod", "manager", "teamlead", "employee"],
      default: "employee",
    },

    roleLevel: { type: Number, default: 1 },

    reportsTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reportsBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    accountApproved: { type: Boolean, default: false },

    accountStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "INACTIVE",
    },

    googleId: { type: String },

    authMethod: {
      type: String,
      enum: ["local", "google", "otp"],
      default: "local",
    },

    otp: { type: String },
    otpExpiry: { type: Date },

    resetPasswordToken: { type: String },
    resetPasswordExpiry: { type: Date },

    inviteToken: { type: String },
    inviteExpiry: { type: Date },

    isActive: { type: Boolean, default: true },

    // =========================
    // 🔐 2FA (Two-Factor Auth)
    // =========================
    twoFactorSecret: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },

    // =========================
    // 📱 Session Tracking
    // =========================
    sessions: [
      {
        deviceInfo: { type: String },   // e.g., Chrome on Windows
        ipAddress: { type: String },
        lastActive: { type: Date, default: Date.now },
        token: { type: String },        // store JWT or session token
      },
    ],
  },
  { timestamps: true }
);

// =========================
// 🔁 Pre-save Hook
// =========================
userSchema.pre("save", async function () {
  if (this.isModified("role")) {
    this.roleLevel = ROLE_LEVELS[this.role] || 1;
  }

  if (this.isModified("password") && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// =========================
// 🔑 Password Match Method
// =========================
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLE_LEVELS = ROLE_LEVELS;