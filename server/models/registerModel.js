const mongoose = require("mongoose");

const registerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNo: { type: String },
    gender: { type: String, enum: ["male", "female", "other"] },
    requestedRole: {
      type: String,
      enum: ["bod", "manager", "teamlead", "employee"],
      default: "employee",
    },
    status: {
      type: String,
      enum: ["NEW", "APPROVED", "REJECTED"],
      default: "NEW",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Register", registerSchema);