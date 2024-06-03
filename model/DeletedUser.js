// models/DeletedUser.js

const mongoose = require("mongoose");

const DeletedUserSchema = new mongoose.Schema({
  username: String,
  email: String,
  mobile: String,
  gender: String,
  password: String,
  deletedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("DeletedUser", DeletedUserSchema);
