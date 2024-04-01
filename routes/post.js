const router = require("express").Router();
const Post = require("../model/Post");
const { ObjectId } = require("mongoose").Types;
const upload = require("../middleware/upload");
const { verifyToken } = require("../middleware/auth");
// add posts
router.post("/addpost/", upload.single("imageUrl"), async (req, res) => {
  try {
    const newPost = new Post(req.body);

    if (req.file) {
      newPost.imageUrl = req.file.filename;
    }

    newPost
      .save()
      .then(() => {
        res
          .status(200)
          .json({ status: true, message: "post added successfully" });
      })
      .catch((e) => {
        res.status(500).json(e);
      });
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

// update posts
router.put("/update/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID provided",
      });
    }
    console.log(req.body);
    Post.findOneAndUpdate({ _id: req.params.id }, { $set: req.body })
      .then(() => {
        return res.status(200).json({
          status: true,
          message: "Post update successfully",
        });
      })
      .catch((e) => {
        return res
          .status(500)
          .json({ status: true, message: "user not found" });
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json(e);
  }
});

// delete  posts
router.delete("/delete/:id", async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id });
    if (post) {
      Post.findByIdAndDelete({ _id: req.params.id }).then(() => {
        return res.status(200).json({ status: true, message: "post Deleted" });
      });
    } else {
      return res.status(200).json({ status: false, message: "Post not found" });
    }
  } catch (e) {
    console.log(e);
  }
});

// get post details by id
router.get("/getpost/:id", async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        status: false,
        message: "Invalid user ID provided",
      });
    }

    const post = await Post.findOne({ _id: req.params.id });
    if (post) {
      res.status(200).json({
        status: true,
        message: "post fetched successfully",
        data: post,
      });
    } else {
      res.status(200).json({
        status: false,
        message: "post not found",
      });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

// get all posts
router.get("/getallpost", verifyToken, async (req, res) => {
  try {
    Post.find()
      .then((posts) => {
        return res.status(200).json({
          status: true,
          message: "All posts fetched successfully",
          data: posts,
        });
      })
      .catch((e) => {
        return res.status(500).json(e);
      });
  } catch (e) {
    console.log(e);
    return res.status(500).json(e);
  }
});
// get all post any user
router.get("/getuserpost/:id", async (req, res) => {
  try {
    Post.find({ userId: req.params.id })
      .then((post) => {
        res
          .status(200)
          .json({ status: true, message: "Get user post", data: post });
      })
      .catch((e) => {
        res.status(500).json(e);
      });
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

// like post
router.put("/like/:id", async (req, res) => {
  try {
    const postId = req.params.id.trim(); // Trim whitespace from the id parameter
    const post = await Post.findOne({ _id: postId });
    let isLike = false;
    console.log(post, "===post==");
    post.likes.map((item) => {
      if (item == req.body.id) {
        isLike = true;
        console.log(post, "====post");
      }
    });

    if (isLike) {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        { $pull: { likes: req.body.id } }
      );
      return res
        .status(200)
        .json({ status: true, message: "Like remove successfully" });
    } else {
      await Post.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { likes: req.body.id } }
      );
      return res
        .status(200)
        .json({ status: true, message: "Like send successfully" });
    }
  } catch (e) {
    console.log(e);
    return res.status(500).json(e);
  }
});

// delete post

module.exports = router;
