// const express = require("express");
// const path = require("path");
// const router = express.Router();
// const jwt = require("jsonwebtoken");
// const sendMail = require("../utils/sendMail");
// const Shop = require("../model/shop");
// const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
// const cloudinary = require("cloudinary");
// const catchAsyncErrors = require("../middleware/catchAsyncErrors");
// const ErrorHandler = require("../utils/ErrorHandler");
// const sendShopToken = require("../utils/shopToken");

// // create shop
// router.post("/create-shop", catchAsyncErrors(async (req, res, next) => {
//   try {
//     const { email } = req.body;
//     const sellerEmail = await Shop.findOne({ email });
//     if (sellerEmail) {
//       return next(new ErrorHandler("User already exists", 400));
//     }

//     const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//       folder: "avatars",
//     });


//     const seller = {
//       name: req.body.name,
//       email: email,
//       password: req.body.password,
//       avatar: {
//         public_id: myCloud.public_id,
//         url: myCloud.secure_url,
//       },
//       address: req.body.address,
//       phoneNumber: req.body.phoneNumber,
//       zipCode: req.body.zipCode,
//     };

//     const activationToken = createActivationToken(seller);

//     const activationUrl = `http://localhost:3000/seller/activation/${activationToken}`;

//     try {
//       await sendMail({
//         email: seller.email,
//         subject: "Activate your Shop",
//         message: `Hello ${seller.name}, please click on the link to activate your shop: ${activationUrl}`,
//       });
//       res.status(201).json({
//         success: true,
//         message: `please check your email:- ${seller.email} to activate your shop!`,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   } catch (error) {
//     return next(new ErrorHandler(error.message, 400));
//   }
// }));

// // create activation token
// const createActivationToken = (seller) => {
//   return jwt.sign(seller, process.env.ACTIVATION_SECRET, {
//     expiresIn: "5m",
//   });
// };

// // activate user
// router.post(
//   "/activation",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { activation_token } = req.body;

//       const newSeller = jwt.verify(
//         activation_token,
//         process.env.ACTIVATION_SECRET
//       );

//       if (!newSeller) {
//         return next(new ErrorHandler("Invalid token", 400));
//       }
//       const { name, email, password, avatar, zipCode, address, phoneNumber } =
//         newSeller;

//       let seller = await Shop.findOne({ email });

//       if (seller) {
//         return next(new ErrorHandler("User already exists", 400));
//       }

//       seller = await Shop.create({
//         name,
//         email,
//         avatar,
//         password,
//         zipCode,
//         address,
//         phoneNumber,
//       });

//       sendShopToken(seller, 201, res);
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // login shop
// router.post(
//   "/login-shop",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { email, password } = req.body;

//       if (!email || !password) {
//         return next(new ErrorHandler("Please provide the all fields!", 400));
//       }

//       const user = await Shop.findOne({ email }).select("+password");

//       if (!user) {
//         return next(new ErrorHandler("User doesn't exists!", 400));
//       }

//       const isPasswordValid = await user.comparePassword(password);

//       if (!isPasswordValid) {
//         return next(
//           new ErrorHandler("Please provide the correct information", 400)
//         );
//       }

//       sendShopToken(user, 201, res);
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // load shop
// router.get(
//   "/getSeller",
//   isSeller,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const seller = await Shop.findById(req.seller._id);

//       if (!seller) {
//         return next(new ErrorHandler("User doesn't exists", 400));
//       }

//       res.status(200).json({
//         success: true,
//         seller,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // log out from shop
// router.get(
//   "/logout",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       res.cookie("seller_token", null, {
//         expires: new Date(Date.now()),
//         httpOnly: true,
//         sameSite: "none",
//         secure: true,
//       });
//       res.status(201).json({
//         success: true,
//         message: "Log out successful!",
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // get shop info
// router.get(
//   "/get-shop-info/:id",
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const shop = await Shop.findById(req.params.id);
//       res.status(201).json({
//         success: true,
//         shop,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // update shop profile picture
// router.put(
//   "/update-shop-avatar",
//   isSeller,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       let existsSeller = await Shop.findById(req.seller._id);

//         const imageId = existsSeller.avatar.public_id;

//         await cloudinary.v2.uploader.destroy(imageId);

//         const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
//           folder: "avatars",
//           width: 150,
//         });

//         existsSeller.avatar = {
//           public_id: myCloud.public_id,
//           url: myCloud.secure_url,
//         };

  
//       await existsSeller.save();

//       res.status(200).json({
//         success: true,
//         seller:existsSeller,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // update seller info
// router.put(
//   "/update-seller-info",
//   isSeller,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { name, description, address, phoneNumber, zipCode } = req.body;

//       const shop = await Shop.findOne(req.seller._id);

//       if (!shop) {
//         return next(new ErrorHandler("User not found", 400));
//       }

//       shop.name = name;
//       shop.description = description;
//       shop.address = address;
//       shop.phoneNumber = phoneNumber;
//       shop.zipCode = zipCode;

//       await shop.save();

//       res.status(201).json({
//         success: true,
//         shop,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // all sellers --- for admin
// router.get(
//   "/admin-all-sellers",
//   isAuthenticated,
//   isAdmin("Admin"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const sellers = await Shop.find().sort({
//         createdAt: -1,
//       });
//       res.status(201).json({
//         success: true,
//         sellers,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // delete seller ---admin
// router.delete(
//   "/delete-seller/:id",
//   isAuthenticated,
//   isAdmin("Admin"),
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const seller = await Shop.findById(req.params.id);

//       if (!seller) {
//         return next(
//           new ErrorHandler("Seller is not available with this id", 400)
//         );
//       }

//       await Shop.findByIdAndDelete(req.params.id);

//       res.status(201).json({
//         success: true,
//         message: "Seller deleted successfully!",
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // update seller withdraw methods --- sellers
// router.put(
//   "/update-payment-methods",
//   isSeller,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const { withdrawMethod } = req.body;

//       const seller = await Shop.findByIdAndUpdate(req.seller._id, {
//         withdrawMethod,
//       });

//       res.status(201).json({
//         success: true,
//         seller,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// // delete seller withdraw merthods --- only seller
// router.delete(
//   "/delete-withdraw-method/",
//   isSeller,
//   catchAsyncErrors(async (req, res, next) => {
//     try {
//       const seller = await Shop.findById(req.seller._id);

//       if (!seller) {
//         return next(new ErrorHandler("Seller not found with this id", 400));
//       }

//       seller.withdrawMethod = null;

//       await seller.save();

//       res.status(201).json({
//         success: true,
//         seller,
//       });
//     } catch (error) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   })
// );

// module.exports = router;
// controller/shop.js

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const sendMail = require("../utils/sendMail");
const sendOtp = require("../utils/sendOtp");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");
const sendShopToken = require("../utils/shopToken");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");

// ----------------------------
// Seller Registration with OTP using Registration Token (Delayed Creation)
// ----------------------------
router.post(
  "/create-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, phoneNumber } = req.body;

      // Check if a shop with the provided email or phone already exists in the Shop collection
      const existingShop = await Shop.findOne({ $or: [{ email }, { phoneNumber }] });
      if (existingShop) {
        return next(new ErrorHandler("Shop already exists", 400));
      }

      // Upload avatar if provided; otherwise, use default empty values.
      let avatarData = { public_id: "", url: "" };
      if (req.body.avatar && req.body.avatar.trim() !== "") {
        const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
          folder: "avatars",
        });
        avatarData = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      // Generate a random 6-digit OTP and expiry (5 minutes)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

      // Build registration payload (do not create a Shop yet)
      const registrationData = {
        name: req.body.name,
        email,
        password: req.body.password,
        avatar: avatarData,
        address: req.body.address,
        phoneNumber,
        zipCode: req.body.zipCode,
        otp,
        otpExpiration: otpExpiry,
      };

      // Sign a temporary registration token (valid for 10 minutes)
      const registrationToken = jwt.sign(
        registrationData,
        process.env.REGISTRATION_SECRET || process.env.JWT_SECRET_KEY,
        { expiresIn: "10m" }
      );

      // Send OTP via mobile and email
      await sendOtp(phoneNumber, otp);
      await sendMail({
        email,
        subject: "Your OTP for Shop Registration",
        message: `Hello ${req.body.name}, your OTP is ${otp}. It is valid for 5 minutes.`,
      });

      // Return the registration token (client stores it automatically)
      res.status(201).json({
        success: true,
        message: `OTP sent to ${phoneNumber} and ${email}. Please verify to complete registration.`,
        registrationToken,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 400));
    }
  })
);

// ----------------------------
// Verify OTP and Create Shop
// ----------------------------
router.post(
  "/verify-otp",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { registrationToken, otp } = req.body;
      if (!registrationToken || !otp) {
        return next(new ErrorHandler("Registration token and OTP are required", 400));
      }

      // Decode registration data from the token
      let registrationData;
      try {
        registrationData = jwt.verify(
          registrationToken,
          process.env.REGISTRATION_SECRET || process.env.JWT_SECRET_KEY
        );
      } catch (err) {
        return next(new ErrorHandler("Registration token is invalid or has expired", 400));
      }

      // Compare OTP values (convert to strings)
      if (registrationData.otp.toString() !== otp.toString()) {
        return next(new ErrorHandler("Invalid OTP", 400));
      }

      if (registrationData.otpExpiration < Date.now()) {
        return next(new ErrorHandler("OTP has expired", 400));
      }

      // OTP is valid — create the shop document in the Shop collection
      const shopData = {
        name: registrationData.name,
        email: registrationData.email,
        password: registrationData.password,
        avatar: registrationData.avatar,
        address: registrationData.address,
        phoneNumber: registrationData.phoneNumber,
        zipCode: registrationData.zipCode,
        isVerified: true,
      };

      const shop = await Shop.create(shopData);

      // Issue JWT token for the seller
      sendShopToken(shop, 201, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Seller Login
// ----------------------------
router.post(
  "/login-shop",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return next(new ErrorHandler("Please provide all fields!", 400));
      }

      const user = await Shop.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("User doesn't exist!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return next(new ErrorHandler("Please provide the correct information", 400));
      }

      sendShopToken(user, 200, res);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Get Seller Profile (for seller dashboard)
// ----------------------------
router.get(
  "/getSeller",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);
      if (!seller) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }
      res.status(200).json({ success: true, seller });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Get Shop Info (for admin)
// ----------------------------
router.get(
  "/get-shop-info/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shop = await Shop.findById(req.params.id);
      res.status(201).json({ success: true, shop });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Logout Seller
// ----------------------------
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    try {
      res.cookie("seller_token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.status(201).json({ success: true, message: "Log out successful!" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Update Shop Avatar (if needed)
// ----------------------------
router.put(
  "/update-shop-avatar",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      let existsSeller = await Shop.findById(req.seller._id);
      if (!req.body.avatar || req.body.avatar === "") {
        return next(new ErrorHandler("Please provide a new avatar", 400));
      }

      // Delete old avatar (if any)
      if (existsSeller.avatar.public_id) {
        await cloudinary.v2.uploader.destroy(existsSeller.avatar.public_id);
      }

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
      });

      existsSeller.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      await existsSeller.save();

      res.status(200).json({ success: true, seller: existsSeller });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Update Seller Info (Profile Update)
// ----------------------------
router.put(
  "/update-seller-info",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, description, address, phoneNumber, zipCode } = req.body;
      const shop = await Shop.findById(req.seller._id);
      if (!shop) {
        return next(new ErrorHandler("User not found", 400));
      }

      shop.name = name;
      shop.description = description;
      shop.address = address;
      shop.phoneNumber = phoneNumber;
      shop.zipCode = zipCode;

      await shop.save();

      res.status(201).json({ success: true, shop });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Get All Sellers (for admin)
// ----------------------------
router.get(
  "/admin-all-sellers",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const sellers = await Shop.find().sort({ createdAt: -1 });
      res.status(201).json({ success: true, sellers });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Delete Seller (for admin)
// ----------------------------
router.delete(
  "/delete-seller/:id",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.params.id);
      if (!seller) {
        return next(new ErrorHandler("Seller is not available with this id", 400));
      }
      await Shop.findByIdAndDelete(req.params.id);
      res.status(201).json({ success: true, message: "Seller deleted successfully!" });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Update Seller Withdraw Methods
// ----------------------------
router.put(
  "/update-payment-methods",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { withdrawMethod } = req.body;
      const seller = await Shop.findByIdAndUpdate(
        req.seller._id,
        { withdrawMethod },
        { new: true }
      );
      res.status(201).json({ success: true, seller });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// ----------------------------
// Delete Seller Withdraw Methods
// ----------------------------
router.delete(
  "/delete-withdraw-method",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const seller = await Shop.findById(req.seller._id);
      if (!seller) {
        return next(new ErrorHandler("Seller not found with this id", 400));
      }
      seller.withdrawMethod = null;
      await seller.save();
      res.status(201).json({ success: true, seller });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;

