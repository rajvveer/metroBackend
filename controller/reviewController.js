const express = require("express");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");

// Import OTP authentication middleware
const { isAuthenticatedOtp } = require("./otpUser");

// POST /api/v2/reviews/add-review
// A user can add or update a review for a product they bought and that has been delivered.
// Optional images are uploaded to Cloudinary.
router.post(
  "/add-review",
  isAuthenticatedOtp,
  catchAsyncErrors(async (req, res, next) => {
    const { productId, rating, comment, images } = req.body;
    if (!productId || !rating || !comment) {
      return next(new ErrorHandler("Product ID, rating, and comment are required", 400));
    }

    // Check if the user has a delivered order containing this product.
    const deliveredOrder = await Order.findOne({
      "user._id": req.user._id,
      "cart": { $elemMatch: { _id: productId } },
      status: "Delivered"
    });
    if (!deliveredOrder) {
      return next(new ErrorHandler("You can only review a product that you have bought and delivered", 400));
    }

    // Upload images to Cloudinary if provided.
    let imagesLinks = [];
    if (images && images.length > 0) {
      for (const img of images) {
        const result = await cloudinary.v2.uploader.upload(img, {
          folder: "reviews",
        });
        imagesLinks.push({
          public_id: result.public_id,
          url: result.secure_url,
        });
      }
    }

    // Create the review object.
    const review = {
      user: { _id: req.user._id, name: req.user.name },
      rating,
      comment,
      images: imagesLinks,
    };

    // Find the product.
    const productDoc = await Product.findById(productId);
    if (!productDoc) {
      return next(new ErrorHandler("Product not found", 404));
    }

    // Check if a review by this user already exists.
    const existingReviewIndex = productDoc.reviews.findIndex(
      (rev) => rev.user._id.toString() === req.user._id.toString()
    );
    if (existingReviewIndex !== -1) {
      // Update the existing review.
      productDoc.reviews[existingReviewIndex] = review;
    } else {
      // Add the new review.
      productDoc.reviews.push(review);
    }

    // Recalculate average rating.
    let totalRating = 0;
    productDoc.reviews.forEach((rev) => totalRating += rev.rating);
    productDoc.ratings = totalRating / productDoc.reviews.length;

    await productDoc.save();

    res.status(200).json({
      success: true,
      review,
      message: "Review submitted successfully!",
    });
  })
);

// GET /api/v2/reviews/get-reviews/:productId
// Returns all reviews for a given product.
router.get(
  "/get-reviews/:productId",
  catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  })
);

module.exports = router;
