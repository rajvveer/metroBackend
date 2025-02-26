const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Product = require("../model/product");
const Order = require("../model/order");
const Shop = require("../model/shop");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");

// create product
router.post(
  "/create-product",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const shopId = req.body.shopId;
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return next(new ErrorHandler("Shop Id is invalid!", 400));
      } else {
        let images = [];

        if (typeof req.body.images === "string") {
          images.push(req.body.images);
        } else {
          images = req.body.images;
        }
      
        const imagesLinks = [];
      
        for (let i = 0; i < images.length; i++) {
          const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
          });
      
          imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url,
          });
        }
      
        const productData = req.body;
        productData.images = imagesLinks;
        productData.shop = shop;

        const product = await Product.create(productData);

        res.status(201).json({
          success: true,
          product,
        });
      }
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

//edit product api
router.put(
  "/edit-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      // Destructure shopId and images, and capture the rest of the fields
      const { shopId, images, ...updatedProductData } = req.body;

      // First, get the existing product
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return next(new ErrorHandler("Product not found!", 404));
      }

      // Validate shopId if provided; otherwise use the product's current shop
      let shop = existingProduct.shop;
      if (shopId) {
        const foundShop = await Shop.findById(shopId);
        if (!foundShop) {
          return next(new ErrorHandler("Shop Id is invalid!", 400));
        }
        shop = foundShop;
      }

      // Process images: upload only new images (ones with base64 data)
      let updatedImages = existingProduct.images;
      if (images && images.length > 0) {
        const newImagesLinks = await Promise.all(
          images.map(async (image) => {
            // Check if the image is new by checking for a base64 prefix
            if (image.url && image.url.startsWith("data:")) {
              const result = await cloudinary.v2.uploader.upload(image.url, {
                folder: "products",
              });
              return {
                public_id: result.public_id,
                url: result.secure_url,
              };
            }
            // Otherwise, keep the existing image data
            return image;
          })
        );
        updatedImages = newImagesLinks;
      }

      // Update product fields; add any additional fields you need
      existingProduct.name = updatedProductData.name || existingProduct.name;
      existingProduct.description =
        updatedProductData.description || existingProduct.description;
      existingProduct.details =
        updatedProductData.details || existingProduct.details;
      existingProduct.category =
        updatedProductData.category || existingProduct.category;
      existingProduct.tags = updatedProductData.tags || existingProduct.tags;
      existingProduct.originalPrice =
        updatedProductData.originalPrice || existingProduct.originalPrice;
      existingProduct.discountPrice =
        updatedProductData.discountPrice || existingProduct.discountPrice;
      existingProduct.stock =
        updatedProductData.stock || existingProduct.stock;
      existingProduct.images = updatedImages;
      existingProduct.shop = shop;

      const updatedProduct = await existingProduct.save();

      res.status(200).json({
        success: true,
        product: updatedProduct,
      });
    } catch (error) {
      return next(
        new ErrorHandler(error.message || "Something went wrong", 400)
      );
    }
  })
);
router.put(
  "/edit-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { id } = req.params;
      // Destructure shopId and images, and capture the rest of the fields
      const { shopId, images, ...updatedProductData } = req.body;

      // First, get the existing product
      const existingProduct = await Product.findById(id);
      if (!existingProduct) {
        return next(new ErrorHandler("Product not found!", 404));
      }

      // Validate shopId if provided; otherwise use the product's current shop
      let shop = existingProduct.shop;
      if (shopId) {
        const foundShop = await Shop.findById(shopId);
        if (!foundShop) {
          return next(new ErrorHandler("Shop Id is invalid!", 400));
        }
        shop = foundShop;
      }

      // Process images: upload only new images (ones with base64 data)
      let updatedImages = existingProduct.images;
      if (images && images.length > 0) {
        const newImagesLinks = await Promise.all(
          images.map(async (image) => {
            // Check if the image is new by checking for a base64 prefix
            if (image.url && image.url.startsWith("data:")) {
              const result = await cloudinary.v2.uploader.upload(image.url, {
                folder: "products",
              });
              return {
                public_id: result.public_id,
                url: result.secure_url,
              };
            }
            // Otherwise, keep the existing image data
            return image;
          })
        );
        updatedImages = newImagesLinks;
      }

      // Update product fields; add any additional fields you need
      existingProduct.name = updatedProductData.name || existingProduct.name;
      existingProduct.description =
        updatedProductData.description || existingProduct.description;
      existingProduct.details =
        updatedProductData.details || existingProduct.details;
      existingProduct.category =
        updatedProductData.category || existingProduct.category;
      existingProduct.tags = updatedProductData.tags || existingProduct.tags;
      existingProduct.originalPrice =
        updatedProductData.originalPrice || existingProduct.originalPrice;
      existingProduct.discountPrice =
        updatedProductData.discountPrice || existingProduct.discountPrice;
      existingProduct.stock =
        updatedProductData.stock || existingProduct.stock;
      existingProduct.images = updatedImages;
      existingProduct.shop = shop;

      const updatedProduct = await existingProduct.save();

      res.status(200).json({
        success: true,
        product: updatedProduct,
      });
    } catch (error) {
      return next(
        new ErrorHandler(error.message || "Something went wrong", 400)
      );
    }
  })
);


// get all products of a shop
router.get(
  "/get-all-products-shop/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find({ shopId: req.params.id });

      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// delete product of a shop
router.delete(
  "/delete-shop-product/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return next(new ErrorHandler("Product is not found with this id", 404));
      }    

      for (let i = 0; 1 < product.images.length; i++) {
        const result = await cloudinary.v2.uploader.destroy(
          product.images[i].public_id
        );
      }
    
      await product.deleteOne();

      res.status(201).json({
        success: true,
        message: "Product Deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// get all products
router.get(
  "/get-all-products",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { search: productName } = req.query;
      let query = {};

      if (productName) {
        // If product name is provided, filter based on product name
        query = { name: { $regex: new RegExp(productName, "i") } };
      }

      const products = await Product.find(query).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);


router.get('/api/get-all-productss', async (req, res, next) => {
  try {
    const { productName } = req.query;
    let query = {};

    if (productName) {
      query = { name: { $regex: new RegExp(productName, 'i') } };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    return next(new ErrorHandler(error, 400));
  }
});
// review for a product
router.put(
  "/create-new-review",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { user, rating, comment, productId, orderId } = req.body;

      const product = await Product.findById(productId);

      const review = {
        user,
        rating,
        comment,
        productId,
      };

      const isReviewed = product.reviews.find(
        (rev) => rev.user._id === req.user._id
      );

      if (isReviewed) {
        product.reviews.forEach((rev) => {
          if (rev.user._id === req.user._id) {
            (rev.rating = rating), (rev.comment = comment), (rev.user = user);
          }
        });
      } else {
        product.reviews.push(review);
      }

      let avg = 0;

      product.reviews.forEach((rev) => {
        avg += rev.rating;
      });

      product.ratings = avg / product.reviews.length;

      await product.save({ validateBeforeSave: false });

      await Order.findByIdAndUpdate(
        orderId,
        { $set: { "cart.$[elem].isReviewed": true } },
        { arrayFilters: [{ "elem._id": productId }], new: true }
      );

      res.status(200).json({
        success: true,
        message: "Reviwed succesfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// all products --- for admin
router.get(
  "/admin-all-products",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const products = await Product.find().sort({
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        products,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);
// Get a single product by ID
router.get(
  "/get-product/:id",
  catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new ErrorHandler("Product not found", 404));
    }
    res.status(200).json({
      success: true,
      product,
    });
  })
);
// router.get(
//   "/search",
//   catchAsyncErrors(async (req, res, next) => {
//     const { query, minRating, expressDelivery, sortBy } = req.query;
//     let filter = {};

//     if (query) {
//       // Search both in name and category using $or
//       filter.$or = [
//         { name: { $regex: new RegExp(query, "i") } },
//         { category: { $regex: new RegExp(query, "i") } }
//       ];
//     }

//     // Optionally filter by minimum rating if provided
//     if (minRating) {
//       filter.rating = { $gte: Number(minRating) };
//     }

//     // Optionally filter for express delivery if provided
//     if (expressDelivery === "true") {
//       filter.expressDelivery = true;
//     }

//     // Fetch products matching the filter
//     let products = await Product.find(filter).sort({ createdAt: -1 });

//     // Apply client-side sorting if needed
//     if (sortBy === "priceLowHigh") {
//       products.sort((a, b) => a.discountPrice - b.discountPrice);
//     } else if (sortBy === "priceHighLow") {
//       products.sort((a, b) => b.discountPrice - a.discountPrice);
//     }

//     res.status(200).json({
//       success: true,
//       products,
//     });
//   })
// );
router.get(
  "/search",
  catchAsyncErrors(async (req, res, next) => {
    const {
      query,
      page = 1,
      limit = 20,
      minRating,
      expressDelivery,
      inStock,
      discounted,
      freeShipping,
      minPrice,
      maxPrice,
      category,
      brands,
      sortBy
    } = req.query;
    
    // Initialize filter object
    let filter = {};
    
    // Basic search by query in name and description
    if (query) {
      filter.$or = [
        { name: { $regex: new RegExp(query, "i") } },
        { description: { $regex: new RegExp(query, "i") } },
        { category: { $regex: new RegExp(query, "i") } }
      ];
    }
    
    // Minimum rating filter
    if (minRating) {
      filter.rating = { $gte: parseFloat(minRating) };
    }
    
    // Express delivery filter
    if (expressDelivery === "true") {
      filter.expressDelivery = true;
    }
    
    // In-stock filter
    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }
    
    // Discounted items filter
    if (discounted === "true") {
      filter.discount = { $gt: 0 };
    }
    
    // Free shipping filter
    if (freeShipping === "true") {
      filter.freeShipping = true;
    }
    
    // Price range filters
    if (minPrice && maxPrice) {
      filter.discountPrice = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
    } else if (minPrice) {
      filter.discountPrice = { $gte: parseFloat(minPrice) };
    } else if (maxPrice) {
      filter.discountPrice = { $lte: parseFloat(maxPrice) };
    }
    
    // Category filter
    if (category) {
      filter.category = category;
    }
    
    // Brands filter - handle both single brand and multiple brands
    if (brands) {
      if (Array.isArray(brands)) {
        filter.brand = { $in: brands };
      } else {
        filter.brand = brands;
      }
    }
    
    // Determine sort criteria
    let sortOptions = {};
    switch (sortBy) {
      case "priceLowHigh":
        sortOptions = { discountPrice: 1 };
        break;
      case "priceHighLow":
        sortOptions = { discountPrice: -1 };
        break;
      case "rating":
        sortOptions = { rating: -1 };
        break;
      case "newest":
        sortOptions = { createdAt: -1 };
        break;
      default:
        // For relevance or default, use a text score if query exists, otherwise newest first
        if (query) {
          // If using MongoDB text index
          // filter.$text = { $search: query };
          // sortOptions = { score: { $meta: "textScore" } };
          sortOptions = { createdAt: -1 }; // Fallback sort
        } else {
          sortOptions = { createdAt: -1 };
        }
    }
    
    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    
    // Execute the query with pagination
    const products = await Product.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);
    
    // Optional: Get total count for pagination metadata
    const totalProducts = await Product.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      products,
      totalProducts,
      currentPage: pageNum,
      totalPages: Math.ceil(totalProducts / limitNum),
      hasMore: skip + products.length < totalProducts
    });
  })
);


module.exports = router;
