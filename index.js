const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const userRouter = require("./routes/user");
const authRouter = require("./routes/auth");
const postRouter = require("./routes/post");
const commentRouter = require("./routes/comments");
dotenv.config();

// middlware
app.use(express.json());
app.use(helmet());
app.use(morgan("comman"));

mongoose
  .connect(process.env.MongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("mongodb databse connected");
  })
  .catch((err) => {
    console.log(err);
  });
  app.get("/", (req,res)=> {
    res.send("Hello dev");
  });
app.use("/uploads", express.static("uploads"));
// http://localhost:8200/uploads/1711028675289_heart.png
app.use("/socialapp/api/comment", commentRouter);
app.use("/socialapp/api/post", postRouter);
app.use("/socialapp/api/users", userRouter);
app.use("/socialapp/api/auth", authRouter);

app.get("/user", (req, res) => {
  res.send("hello user");
});


app.listen(process.env.PORT || 8200, () => {
  console.log("app is runnig on port ", process.env.PORT || 8200);
});
