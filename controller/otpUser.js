// controller/otpUser.js
const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../middleware/error");
const UserOtp = require("../model/UserOtp");
const sendOtp = require("../utils/sendOtp");
const jwt = require("jsonwebtoken");

// =====================================================================
// Authentication Middleware for OTP Users
// =====================================================================
const isAuthenticatedOtp = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res
      .status(401)
      .json({ success: false, message: "Please login to continue" });
  }
  try {
    const token = authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await UserOtp.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized" });
  }
};

// =====================================================================
// @route   POST /api/v2/otp/send-otp
// @desc    Send OTP for mobile app login/registration via phone
// @access  Public
// =====================================================================
router.post(
  "/send-otp",
  catchAsyncErrors(async (req, res, next) => {
    const { phone } = req.body;
    if (!phone) {
      return next(new ErrorHandler("Phone number is required", 400));
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; // valid for 5 minutes

    // Look up the user by mobileNumber in the OTP model
    let user = await UserOtp.findOne({ mobileNumber: phone });
    if (user) {
      // If user exists, update the OTP fields
      user.otp = otp;
      user.otpExpiration = otpExpiry;
      await user.save();
      await sendOtp(phone, otp);
      return res.status(200).json({
        success: true,
        message: `OTP sent for login to ${phone}`,
      });
    } else {
      // If user doesn't exist, create a new OTP-based user record
      user = await UserOtp.create({
        mobileNumber: phone,
        otp,
        otpExpiration: otpExpiry,
      });
      await sendOtp(phone, otp);
      return res.status(200).json({
        success: true,
        message: `OTP sent for registration to ${phone}`,
      });
    }
  })
);

// =====================================================================
// @route   POST /api/v2/otp/verify-otp
// @desc    Verify OTP and log in the user
// @access  Public
// =====================================================================
router.post(
  "/verify-otp",
  catchAsyncErrors(async (req, res, next) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return next(
        new ErrorHandler("Both phone number and OTP are required", 400)
      );
    }

    const user = await UserOtp.findOne({ mobileNumber: phone });
    if (!user) {
      return next(
        new ErrorHandler("User not found. Please register first.", 404)
      );
    }

    if (user.otp !== otp) {
      return next(new ErrorHandler("Invalid OTP", 400));
    }

    if (user.otpExpiration < Date.now()) {
      return next(new ErrorHandler("OTP has expired", 400));
    }

    // OTP is valid – mark the user as verified and clear the OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiration = undefined;
    await user.save();

    // Generate a token using the OTP model's method
    const token = user.getJwtToken();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. User logged in.",
      token,
    });
  })
);

// =====================================================================
// @route   PUT /api/v2/otp/update-profile
// @desc    Update app user profile (e.g., add/update email, name, avatar, addresses)
// @access  Private (requires OTP user to be logged in)
// =====================================================================
router.put(
  "/update-profile",
  isAuthenticatedOtp,
  catchAsyncErrors(async (req, res, next) => {
    // Extract updatable fields from the request body
    const { name, email, avatar, addresses } = req.body;
    const user = req.user;

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;
    if (avatar !== undefined) user.avatar = avatar;
    if (addresses !== undefined) user.addresses = addresses;

    await user.save();
    res.status(200).json({ success: true, user });
  })
);

// =====================================================================
// @route   GET /api/v2/otp/profile
// @desc    Get OTP user profile
// @access  Private (requires OTP user to be logged in)
// =====================================================================
router.get(
  "/profile",
  isAuthenticatedOtp,
  catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({ success: true, user: req.user });
  })
);

module.exports = { router, isAuthenticatedOtp };
