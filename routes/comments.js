const router = require("express").Router();
const Comments = require("../model/Comments");
const Post = require("../model/Post");
// add comment

router.post("/add", async (req, res) => {
  try {
    const newComment = new Comments({
      comment: req.body.comment,
      userId: req.body.userId,
      username: req.body.username,
      postId: req.body.postId,
    });
    await newComment.save();
    res
      .status(200)
      .json({ status: true, message: "comment added successfully" });
  } catch (e) {
    res.status(500).json(e);
    console.log(e);
  }
});

// delete commect
router.delete("/delete/:id", async (req, res) => {
  try {
    const comment = await Comments.findOne({ _id: req.params.id });
    console.log(comment, "====commetn");
    if (comment) {
      Comments.findOneAndDelete({ _id: req.params.id })
        .then(() => {
          return res
            .status(200)
            .json({ status: true, message: "comment deleted successfully" });
        })
        .catch((e) => {
          return res.status(500).json(e);
        });
    } else {
      res.status(200).json({ status: false, message: "comment Not found" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json(e);
  }
});

// get all comments by post
router.get("/getall/:id", async (req, res) => {
  try {
    Comments.find({ postId: req.params.id })
      .then((comments) => {
        return res.status(200).json({
          status: true,
          message: "All comments fetched successfully",
          data: comments,
        });
      })
      .catch((e) => {
        return res.status(500).json(e);
      });
  } catch {
    res.status(500).json(e);
    console.log(e);
  }
});

// update comment
router.put("/update/:id", async (req, res) => {
  try {
    Comments.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body }
    )
      .then(() => {
        return res.status(200).json({
          status: true,
          message: "update successfully",
        });
      })
      .catch((e) => {
        return res.status(500).json(e);
      });
  } catch {
    res.status(500).json(e);
    console.log(e);
  }
});

module.exports = router;
