// controller/otpUser.js
const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../middleware/error");
const UserOtp = require("../model/UserOtp");
const sendOtp = require("../utils/sendOtp");

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
        otp: otp,
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
// @desc    Verify OTP and log in or register the user
// @access  Public
// =====================================================================
router.post(
  "/verify-otp",
  catchAsyncErrors(async (req, res, next) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return next(new ErrorHandler("Both phone number and OTP are required", 400));
    }

    const user = await UserOtp.findOne({ mobileNumber: phone });
    if (!user) {
      return next(new ErrorHandler("User not found. Please register first.", 404));
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

module.exports = router;
