const express = require("express");
const User = require("../model/user");
const router = express.Router();
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated, isAdmin } = require("../middleware/auth");
const twilio = require('twilio');
const sendOtp = require("../utils/sendOtp");
// create user
router.post("/create-user", async (req, res, next) => {
  try {
    const { name, email, password, avatar } = req.body;
    const userEmail = await User.findOne({ email });

    if (userEmail) {
      return next(new ErrorHandler("User already exists", 400));
    }

    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
      folder: "avatars",
    });

    const user = {
      name: name,
      email: email,
      password: password,
      avatar: {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      },
    };

    const activationToken = createActivationToken(user);

    const activationUrl = `http://localhost:3000/activation/${activationToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello ${user.name}, please click on the link to activate your account: ${activationUrl}`,
      });
      res.status(201).json({
        success: true,
        message: `please check your email:- ${user.email} to activate your account!`,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// create activation token
const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

// activate user
router.post(
  "/activation",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { activation_token } = req.body;

      const newUser = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET
      );

      if (!newUser) {
        return next(new ErrorHandler("Invalid token", 400));
      }
      const { name, email, password, avatar } = newUser;

      let user = await User.findOne({ email });

      if (user) {
        return next(new ErrorHandler("User already exists", 400));
      }
      user = await User.create({
        name,
        email,
        avatar,
        password,
      });

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
//create user end


// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      sendToken(user, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// load user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return next(new ErrorHandler("User doesn't exists", 400));
      }

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// log out user
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({
        success: true,
        message: "Log out successful!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user info
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password, phoneNumber, name } = req.body;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400)
        );
      }

      user.name = name;
      user.email = email;
      user.phoneNumber = phoneNumber;

      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      let existsUser = await User.findById(req.user.id);
      if (req.body.avatar !== "") {
        const imageId = existsUser.avatar.public_id;

        await cloudinary.v2.uploader.destroy(imageId);

        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
          folder: "avatars",
          width: 150,
        });

        existsUser.avatar = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      await existsUser.save();

      res.status(200).json({
        success: true,
        user: existsUser,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user addresses
router.put(
  "/update-user-addresses",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      const sameTypeAddress = user.addresses.find(
        (address) => address.addressType === req.body.addressType
      );
      if (sameTypeAddress) {
        return next(
          new ErrorHandler(`${req.body.addressType} address already exists`)
        );
      }

      const existsAddress = user.addresses.find(
        (address) => address._id === req.body._id
      );

      if (existsAddress) {
        Object.assign(existsAddress, req.body);
      } else {
        // add the new address to the array
        user.addresses.push(req.body);
      }

      await user.save();

      res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete user address
router.delete(
  "/delete-user-address/:id",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.id;

      await User.updateOne(
        {
          _id: userId,
        },
        { $pull: { addresses: { _id: addressId } } }
      );

      const user = await User.findById(userId);

      res.status(200).json({ success: true, user });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// update user password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select("+password");

      const isPasswordMatched = await user.comparePassword(
        req.body.oldPassword
      );

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Old password is incorrect!", 400));
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return next(
          new ErrorHandler("Password doesn't matched with each other!", 400)
        );
      }
      user.password = req.body.newPassword;

      await user.save();

      res.status(200).json({
        success: true,
        message: "Password updated successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// find user infoormation with the userId
router.get(
  "/user-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      res.status(201).json({
        success: true,
        user,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// all users --- for admin
router.get(
  "/admin-all-users",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const users = await User.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        users,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// delete users --- admin
router.delete(
  "/delete-user/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return next(
          new ErrorHandler("User is not available with this id", 400)
        );
      }

      const imageId = user.avatar.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      await User.findByIdAndDelete(req.params.id);

      res.status(201).json({
        success: true,
        message: "User deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
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

    // Try to find the user by phone number
    let user = await User.findOne({ mobileNumber: phone });
    if (user) {
      // If user exists, update the OTP fields
      user.otp = otp;
      user.otpExpiration = otpExpiry;
      await user.save();

      // Send the OTP via Twilio
      await sendOtp(phone, otp);
      return res.status(200).json({
        success: true,
        message: `OTP sent for login to ${phone}`,
      });
    } else {
      // If user doesn't exist, create a new user record with the mobile number.
      // IMPORTANT: Explicitly set authType to "otp" to avoid triggering email-related validations.
      user = await User.create({ 
        authType: "otp", 
        mobileNumber: phone, 
        otp, 
        otpExpiration: otpExpiry 
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
// @route   POST /api/v2/user/verify-otp
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

    const user = await User.findOne({ mobileNumber: phone });
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

    // Generate a token (using the method from the user model)
    const token = user.getJwtToken();

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. User logged in.",
      token,
    });
  })
);
// POST /add-review: Add a review for a product
router.post(
  "/add-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { productId, rating, comment } = req.body;

      if (!productId || !rating || !comment) {
        return next(
          new ErrorHandler("Please provide productId, rating, and comment", 400)
        );
      }

      // Check if the product exists
      const product = await Product.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      // Check if the user has bought and received the product.
      // Adjust the query based on your Order model schema.
      const order = await Order.findOne({
        user: req.user._id,
        orderStatus: "Delivered",
        "orderItems.product": productId,
      });
      if (!order) {
        return next(
          new ErrorHandler(
            "You can only review products that you have bought and that have been delivered",
            400
          )
        );
      }

      // Check if the user has already reviewed this product.
      const alreadyReviewed = product.reviews.find(
        (rev) => rev.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        return next(new ErrorHandler("You have already reviewed this product", 400));
      }

      // Process optional review images if provided.
      let reviewImages = [];
      if (req.body.images) {
        let images = [];
        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }

        // Upload each image to Cloudinary (folder: reviews)
        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "reviews",
          });
          reviewImages.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }
      }

      // Create the review object
      const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
        images: reviewImages,
      };

      // Add the review to the product's reviews array.
      product.reviews.push(review);

      // Optionally update product's overall ratings and review count.
      product.numOfReviews = product.reviews.length;
      product.ratings =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();

      res.status(201).json({
        success: true,
        message: "Review added successfully",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// GET /get-reviews/:productId: Retrieve all reviews for a product
router.get(
  "/get-reviews/:productId",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }
      res.status(200).json({
        success: true,
        reviews: product.reviews,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Function to send OTP via SMS using Twilio
// async function sendOTP(mobileNumber, otp) {
//   try {
//       await client.messages.create({
//           body: `Your OTP is: ${otp}`,
//           from: process.env.TWILIO_PHONE_NUMBER,
//           to: mobileNumber
//       });
//       console.log('OTP sent successfully');
//   } catch (err) {
//       console.error('Error sending OTP:', err);
//       throw new Error('Failed to send OTP');
//   }
// }


module.exports = router;
