const mongoose = require("mongoose");

const CommectSchema = new mongoose.Schema(
  {
    comment: {
      type: String,
      max: 200,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to User model
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    postId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommectSchema);
