const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  user: {
    _id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    name: { 
      type: String, 
      required: true 
    },
  },
  rating: { 
    type: Number, 
    required: true 
  },
  comment: { 
    type: String, 
    required: true 
  },
  images: [
    {
      public_id: { type: String },
      url: { type: String },
    }
  ],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
});

module.exports = mongoose.model("Review", reviewSchema);
