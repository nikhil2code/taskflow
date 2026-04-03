const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
      type: String,
      enum: ["manager", "teamlead", "employee"],
      default: "employee",
    },
    googleId: { type: String },
    authMethod: {
      type: String,
      enum: ["local", "google", "otp"],
      default: "local",
    },
    otp: { type: String },
    otpExpiry: { type: Date },

    // For password reset:
resetPasswordToken: { type: String },
resetPasswordExpiry: { type: Date },

  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);