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
  otp: String,
  otpExpiration: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Additional profile fields for app users
  name: {
    type: String,
    default: "",
  },
  email: {
    type: String,
    default: "",
  },
  avatar: {
    public_id: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  addresses: [
    {
      country: { type: String },
      city: { type: String },
      address1: { type: String },
      address2: { type: String },
      zipCode: { type: Number },
      addressType: { type: String },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate JWT token method for OTP users
userOtpSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

module.exports = mongoose.model("UserOtp", userOtpSchema);
