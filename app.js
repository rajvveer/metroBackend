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
const express = require("express");
const ErrorHandler = require("./middleware/error");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(
  cors({
    origin: "https://gravoapp.com",
    credentials: true,
  })
);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use("/test", (req, res) => {
  res.send("Hello world!");
});
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "100mb",
    parameterLimit: 50000,
  })
);

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: "config/.env",
  });
}

// import routes for your website
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

app.use("/api/v2/user", user);
app.use("/api/v2/otp", otpUser); // OTP endpoints are now under /api/v2/otp
app.use("/api/v2/conversation", conversation);
app.use("/api/v2/message", message);
app.use("/api/v2/order", order);
app.use("/api/v2/shop", shop);
app.use("/api/v2/product", product);
app.use("/api/v2/event", event);
app.use("/api/v2/coupon", coupon);
app.use("/api/v2/payment", payment);
app.use("/api/v2/withdraw", withdraw);

// Error handling middleware (should be last)
app.use(ErrorHandler);

module.exports = app;
