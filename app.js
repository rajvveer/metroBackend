// const express = require("express");
// const ErrorHandler = require("./middleware/error");
// const app = express();
// const cookieParser = require("cookie-parser");
// const bodyParser = require("body-parser");
// const cors = require("cors");

// app.use(cors({
//   origin: 'https://gravoapp.com',
//   credentials: true
// }));

// // app.use(express.json());
// app.use(express.json({limit: '50mb'}));
// app.use(cookieParser());
// app.use("/test", (req, res) => {
//   res.send("Hello world!");
// });

// app.use(bodyParser.urlencoded({ extended: true, limit: "100mb",parameterLimit:50000 }));
// // app.use(express.bodyParser({limit: '50mb'}));

// // config
// if (process.env.NODE_ENV !== "PRODUCTION") {
//   require("dotenv").config({
//     path: "config/.env",
//   });
// }

// // import routes
// const user = require("./controller/user");
// const shop = require("./controller/shop");
// const product = require("./controller/product");
// const event = require("./controller/event");
// const coupon = require("./controller/coupounCode");
// const payment = require("./controller/payment");
// const order = require("./controller/order");
// const conversation = require("./controller/conversation");
// const message = require("./controller/message");
// const withdraw = require("./controller/withdraw");

// app.use("/api/v2/user", user);
// app.use("/api/v2/conversation", conversation);
// app.use("/api/v2/message", message);
// app.use("/api/v2/order", order);
// app.use("/api/v2/shop", shop);
// app.use("/api/v2/product", product);
// app.use("/api/v2/event", event);
// app.use("/api/v2/coupon", coupon);
// app.use("/api/v2/payment", payment);
// app.use("/api/v2/withdraw", withdraw);

// // it's for ErrorHandling
// app.use(ErrorHandler);

// module.exports = app;
// app.js
// app.js
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");

// Set up CORS for your website domain
const allowedOrigins = ["https://gravoapp.com", "http://localhost:8081"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like some mobile or testing scenarios)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// Parse JSON bodies with an increased size limit
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());

// A simple test endpoint
app.use("/test", (req, res) => {
  res.send("Hello world!");
});

// Parse URL-encoded bodies
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "100mb",
    parameterLimit: 50000,
  })
);

// Load environment variables if not in production
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// Import routes for website users and others
const user = require("./controller/user");
const shop = require("./controller/shop");
const product = require("./controller/product");
const event = require("./controller/event");
const coupon = require("./controller/coupounCode");
const payment = require("./controller/payment");
const order = require("./controller/order");
const conversation = require("./controller/conversation");
const message = require("./controller/message");
const withdraw = require("./controller/withdraw");

// Import the OTP routes for mobile app login
const otpUser = require("./controller/otpUser");

// Import review routes (new controller)
const reviewController = require("./controller/reviewController");

// (Optional) Import admin routes if needed later
// const admin = require("./controller/admin");

// Mount routes
app.use("/api/v2/user", user);      // Website user routes
app.use("/api/v2/otp", otpUser);      // OTP endpoints for mobile app users
// app.use("/api/v2/admin", admin);   // Admin routes (for later use)
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);
app.use("/api/v2/reviews", reviewController);  // New reviews endpoints

// Error handling middleware (must be last)
app.use(ErrorHandler);

module.exports = app;
