// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// const userSchema = new mongoose.Schema({
//   name:{
//     type: String,
//     required: [true, "Please enter your name!"],
//   },
//   email:{
//     type: String,
//     required: [true, "Please enter your email!"],
//   },
//   password:{
//     type: String,
//     required: [true, "Please enter your password"],
//     minLength: [8, "Password should be greater than 6 characters"],
//     select: false,
//   },
//   phoneNumber:{
//     type: Number,
//   },
//   addresses:[
//     {
//       country: {
//         type: String,
//       },
//       city:{
//         type: String,
//       },
//       address1:{
//         type: String,
//       },
//       address2:{
//         type: String,
//       },
//       zipCode:{
//         type: Number,
//       },
//       addressType:{
//         type: String,
//       },
//     }
//   ],
//   role:{
//     type: String,
//     default: "user",
//   },
//   avatar:{
//     public_id: {
//       type: String,
//       required: false,
//     },
//     url: {
//       type: String,
//       required: true,
//     },
//  },
//  mobileNumber: {
//   type: String
// },
// otp: {
//   type: String
// },
// otpExpiration: {
//   type: Date
// },
// isVerified: {
//   type: Boolean,
//   default: false
// },
//  createdAt:{
//   type: Date,
//   default: Date.now(),
//  },
//  resetPasswordToken: String,
//  resetPasswordTime: Date,
// });



// //  Hash password
// userSchema.pre("save", async function (next){
//   if(!this.isModified("password")){
//     next();
//   }

//   this.password = await bcrypt.hash(this.password, 10);
// });

// // jwt token
// userSchema.methods.getJwtToken = function () {
//   return jwt.sign({ id: this._id}, process.env.JWT_SECRET_KEY,{
//     expiresIn: process.env.JWT_EXPIRES,
//   });
// };

// // compare password
// userSchema.methods.comparePassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("User", userSchema);

// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  // Determines the authentication method.
  // "email" for website (email/password) login,
  // "otp" for mobile app (OTP) login.
  authType: {
    type: String,
    enum: ["email", "otp"],
    default: "email",
  },

  // Fields required only for email-based authentication.
  name: {
    type: String,
    required: function () {
      return this.authType === "email";
    },
  },
  email: {
    type: String,
    required: function () {
      return this.authType === "email";
    },
    unique: function () {
      return this.authType === "email";
    },
  },
  password: {
    type: String,
    required: function () {
      return this.authType === "email";
    },
    minLength: [8, "Password should be at least 8 characters"],
    select: false,
  },
  avatar: {
    public_id: String,
    url: {
      type: String,
      required: function () {
        return this.authType === "email";
      },
    },
  },

  // Field required only for OTP-based authentication.
  mobileNumber: {
    type: String,
    required: function () {
      return this.authType === "otp";
    },
    unique: function () {
      return this.authType === "otp";
    },
  },

  // OTP and OTP expiration (for OTP-based login)
  otp: String,
  otpExpiration: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },

  // Other common fields
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
  role: {
    type: String,
    default: "user",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

// Pre-save hook to hash the password only for email-based accounts.
userSchema.pre("save", async function (next) {
  if (this.authType === "email" && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Instance method to generate a JWT token.
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// Instance method to compare password (only used for email logins).
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);


