const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

const Razorpay = require("razorpay");
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a Razorpay order
router.post(
  "/razorpay/process",
  catchAsyncErrors(async (req, res, next) => {
    const { amount } = req.body; // amount should be provided in paise (e.g. ₹10 = 1000 paise)
    const options = {
      amount: amount, // amount in paise
      currency: "INR",
      receipt: `receipt_order_${Math.random().toString(36).substring(7)}`,
      payment_capture: 1, // automatic capture
    };

    const order = await razorpayInstance.orders.create(options);
    res.status(200).json({
      success: true,
      order,
    });
  })
);

// Return Razorpay key id to the client if needed
router.get(
  "/razorpaykey",
  catchAsyncErrors(async (req, res, next) => {
    res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
  })
);

module.exports = router;
