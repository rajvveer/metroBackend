// models/UserOtp.js
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userOtpSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: [true, "Mobile number is required"],
    unique: true,
    match: [
      /^\+?[1-9]\d{1,14}$/,
      "Please enter a valid phone number in E.164 format (e.g., +911234567890)",
    ],
  },
  otp: {
    type: String,
  },
  otpExpiration: {
    type: Date,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate JWT token for OTP users
userOtpSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

module.exports = mongoose.model("UserOtp", userOtpSchema);
