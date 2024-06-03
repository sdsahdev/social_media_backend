const router = require("express").Router();
const { verifyToken } = require("../middleware/auth");
const User = require("../model/User");
const DeletedUser = require("../model/DeletedUser");

const bcrypt = require("bcrypt");
const { ObjectId } = require("mongoose").Types;

// update
router.put("/update/:id", async (req, res) => {
  try {
    const validKeys = [
      "username",
      "email",
      "mobile",
      "gender",
      "password",
      "dob",
      "address",
      "profilePic",
      "coverPic",
      "follower",
      "following",
      "bio",
    ];

    // Check if any invalid keys are present in the request body
    const invalidKeys = Object.keys(req.body).filter(
      (key) => !validKeys.includes(key)
    );
    if (invalidKeys.length > 0) {
      return res.status(400).json({
        status: false,
        message: `Invalid keys found in request body: ${invalidKeys.join(
          ", "
        )}`,
      });
    }

    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, salt);
    }
    await User.findOneAndUpdate({ _id: req.params.id }, { $set: req.body });

    res.status(200).json({
      status: true,
      message: "user data updated successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

// delete
router.delete("/delete/:id", async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (user) {
      // Save user data to DeletedUser collection
      const deletedUser = new DeletedUser({
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        gender: user.gender,
        password: user.password, // Include password if needed, but typically hashed passwords are fine
        deletedAt: new Date(),
      });

      await deletedUser.save();

      User.findByIdAndDelete({ _id: req.params.id }).then(() => {
        return res.status(200).json({ status: true, message: "User Deleted" });
      });
    } else {
      return res.status(200).json({ status: false, message: "User not found" });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json(e);
  }
});

// get all user

router.get("/getAllUser/", verifyToken, async (req, res) => {
  try {
    await User.find().then((users) => {
      res.status(200).json({
        status: true,
        message: "user fetched successfully",
        data: users,
      });
    });
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

// get user by id
router.get("/getUser/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID provided",
      });
    }

    const user = await User.findOne({ _id: req.params.id });
    if (user) {
      res.status(200).json({
        status: true,
        message: "user fetched successfully",
        data: user,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "user not found",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

// follow
router.put("/follow/:id", async (req, res) => {
  try {
    //  req.params.id == other user id
    // req.body.id == current login user id
    const user = await User.findById({ _id: req.params.id });
    let isfollow = false;
    user.follower.map((item) => {
      if (item == req.body.id) {
        isfollow = true;
      }
    });

    if (isfollow) {
      await User.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { follower: req.body.id } }
      );
      await User.findOneAndUpdate(
        { _id: req.body.id },
        { $pull: { following: req.params.id } }
      );
      return res.status(200).json({
        status: true,
        message: "unfollowed successfully",
      });
    } else {
      await User.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { follower: req.body.id } }
      );
      await User.findOneAndUpdate(
        { _id: req.body.id },
        { $push: { following: req.params.id } }
      );
      return res.status(200).json({
        status: true,
        message: "followed successfully",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

//   // unfollow
// router.put("/unfollow/:id", async(req,res)=> {
//     try{
//       const user = await User.findById({_id: req.params.id});
//       const currentuser = await User.findById({_id: req.body.id});

//       let isfollow = false;
//       user.follower.map((item) => {
//         if(item == req.body.id){
//           isfollow = true
//         }
//       })

//       if(!isfollow){
//         return res.status(400).json({
//           status: false,
//           message: "You are not following this user"
//         })
//       }else{
//         await User.findOneAndUpdate({_id:req.params.id}, {$pull:{follower :req.body.id}})
//         await User.findOneAndUpdate({_id:req.body.id}, {$pull:{following:req.params.id}})
//         return res.status(200).json({
//           status: true,
//           message: "unfollowed successfully"
//         })
//       }

//     }catch(e){
//       console.log(e);
//       res.status(500).json(e);
//     }
//   })

module.exports = router;
