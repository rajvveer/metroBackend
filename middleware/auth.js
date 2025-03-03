const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("./catchAsyncErrors");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Shop = require("../model/shop");

exports.isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  // Try to get token from cookies first, then from authorization header
  const token = req.cookies.token || req.headers.authorization;
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please login to continue"
    });
  }
  
  // Verify the token using the secret key
  const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  
  // Fetch the user based on the token's decoded id
  req.user = await User.findById(decoded.id);
  
  next();
});


exports.isSeller = catchAsyncErrors(async(req,res,next) => {
    const {seller_token} = req.cookies;
    if(!seller_token){
        return next(new ErrorHandler("Please login to continue", 401));
    }

    const decoded = jwt.verify(seller_token, process.env.JWT_SECRET_KEY);

    req.seller = await Shop.findById(decoded.id);

    next();
});


exports.isAdmin = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`${req.user.role} can not access this resources!`))
        };
        next();
    }
}
