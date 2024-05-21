const User = require("../model/User");
const { v4: uuid } = require("uuid");
const { v2: cloudinary } = require("cloudinary");

const getUserDetails = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (user) {
      return {
        id: user._id,
        username: user.username,
        // Add any other user details you need here
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user details:", error);
    return null;
  }
};

const deleteFilesFromCloudinary = async (publicId) => {
  console.log("delete Files From Cloudinary" + publicId);
};
const uploadFilesOnClodenary = async (files = []) => {
  try {
    const uploadPromise = files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          file.path, // Pass the file buffer directly
          { resource_type: "auto", public_id: uuid() },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
      });
    });

    const result = await Promise.all(uploadPromise);
    return result;
  } catch (error) {
    throw error;
  }
};

const getSockets = (users = []) => {
  const socktes = users.map((user) => userSocketIds.get(user.toString()));
  return socktes;
};

module.exports = {
  getUserDetails,
  deleteFilesFromCloudinary,
  getSockets,
  uploadFilesOnClodenary,
};
