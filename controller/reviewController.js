const express = require("express");
const router = express.Router();
const Review = require("../model/reviewModel");
const Order = require("../model/order");
const Product = require("../model/product");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

// POST /api/v2/reviews/add-review
// Allows a user to add (or update) a review for a product that they have bought and delivered.
// Optional images are uploaded to Cloudinary.
router.post(
  "/add-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { productId, rating, comment, images } = req.body;
    if (!productId || !rating || !comment) {
      return next(new ErrorHandler("Product ID, rating, and comment are required", 400));
    }

    // Check if the user has any delivered order containing this product.
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

    // Check if the user already reviewed this product.
    let reviewDoc = await Review.findOne({ product: productId, "user._id": req.user._id });
    if (reviewDoc) {
      // Update the existing review.
      reviewDoc.rating = rating;
      reviewDoc.comment = comment;
      reviewDoc.images = imagesLinks;
      await reviewDoc.save();
    } else {
      // Create a new review.
      reviewDoc = await Review.create({
        product: productId,
        user: { _id: req.user._id, name: req.user.name },
        rating,
        comment,
        images: imagesLinks,
      });
    }

    // Optionally, update the average rating in the Product document.
    const productDoc = await Product.findById(productId);
    if (productDoc) {
      // Find all reviews for this product.
      const reviews = await Review.find({ product: productId });
      let totalRating = 0;
      reviews.forEach(rev => totalRating += rev.rating);
      productDoc.ratings = totalRating / reviews.length;
      await productDoc.save();
    }

    res.status(200).json({
      success: true,
      review: reviewDoc,
      message: "Review submitted successfully!",
    });
  })
);

// GET /api/v2/reviews/get-reviews/:productId
// Returns all reviews for a given product.
router.get(
  "/get-reviews/:productId",
  catchAsyncErrors(async (req, res, next) => {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      reviews,
    });
  })
);

module.exports = router;
