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
const adminRouter = require("./routes/admin");
const { createServer } = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const chatRouter = require("./routes/chat");
dotenv.config();
const bodyParser = require("body-parser");
const { v2 : cloudinary} = require("cloudinary");
const ChatMessage  = require("./model/chat-app/message.models");
const multer = require("multer");
const {
  createSignleChat,
  createGroupChat,
  createMessages,
} = require("./seeders/users");
const { NEW_MESSAGE } = require("./constants/events");
// const upload = multer();
// middlware
app.use(express.json());
app.use(helmet());
app.use(morgan("comman"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(upload.array());
app.use(express.static("public"));
// Set up Multer middleware for handling multiple file uploads
const { v4: uuid } = require("uuid");
const { getSockets } = require("./Utils/commanf");

const server = createServer(app);
const io = new Server(server);
const userSocketIds = new Map();

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
  cloudinary.config({
    cloud_name:process.env.CLOUDNARY_CLOUD_NAME,
    api_key:process.env.CLOUDNARY_API_KEY,
    api_secret:process.env.CLOUDNARY_API_SECRET,
  })
app.get("/", (req, res) => {
  res.send("Hello dev");
});

// **********************  SOKET CODE START LIVE ******************************************

io.on("connection", (socket) => {
  console.log("user connected");

  // exmaple user 
  const user = {
    _id: "idd",
    name: "sahdev",
  };
  userSocketIds.set(user._id.toString(), socket.id);
  console.log(userSocketIds);
  socket.on(NEW_MESSAGE, async ({ chatId, participants, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user._id,
        name: user.name,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDb = {
      content: message,
      sender: user._id,
      chat: chatId,
    };
    const participantSocket = getSockets(participants);
    io.to(participantSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(participantSocket).emit(NEW_MESSAGE, { chatId });
    try {

      await ChatMessage.create(messageForDb);
    }catch (error){
      console.log(error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    userSocketIds.delete(user._id.toString());
  });
});

// **********************  SOKET CODE END LIVE ******************************************

// **********************  SOKET CODE START practice ******************************************

// createMessages("66067153909befd1dea18aed", 40)
// createSignleChat(5)
// createGroupChat(5)

// app.get("/logindev", (req, res) => {
//   const token = jwt.sign({_id:"ddeinowdndqqwbedfbqewfb"},sercretKey)
//   res.cookie("token", token, { httpOnly:false, secure:true, sameSite:"none" })
//   .json({message :"login successfully"})
// });

// const user = false
// io.use((socket, next) =>{
//   cookieParser()(socket.request, socket.request.res, (err) => {

//     if(err) return next(err);
//     const token = socket.request.cookies.token;

//      if(!token) return next(new Error("Invalid token"));

//      const decoded = jwt.verify(token, sercretKey);
//      next();
//   })
// } )

// io.on("connection", (socket) => {
//   console.log("user connected");
//   console.log("ID", socket.id);
//   // socket.emit("welcoem", "welcome to the server")
//   // socket.broadcast.emit("welcoem", `${socket.id} join the server`)

//   socket.on("message", ({ data, room }) => {
//     console.log(data);

//     /******    for send all users message  **********/
//     //  io.emit("recived_msg", data);

//     /******    for send all users message unless you  **********/
//     //  socket.broadcast.emit("recived_msg", data);

//     /******    for send all users message unless you  **********/
//     // io.to(room).emit("recived_msg", data);

//     /******    for send all users message unless you  same as IO.to**********/
//     socket.to(room).emit("recived_msg", data);

//     //  ************* room craeted *******************//

//   });

//   socket.on("join_room", (room) => {
//     socket.join(room);
//     console.log("User joined " +room);
//   })
//   socket.on("disconnect", () => {
//     console.log("user disconnected " + socket.id);
//   });
// });

// **********************  SOKET CODE END ******************************************

app.use("/uploads", express.static("uploads"));
// http://localhost:8200/uploads/1711028675289_heart.png
app.use("/socialapp/api/admin", adminRouter);
app.use("/socialapp/api/chat", chatRouter);
app.use("/socialapp/api/comment", commentRouter);
app.use("/socialapp/api/post", postRouter);
app.use("/socialapp/api/users", userRouter);
app.use("/socialapp/api/auth", authRouter);

app.get("/user", (req, res) => {
  res.send("hello user");
});

server.listen(process.env.PORT || 8000, () => {
  console.log("app is runnig on port ", process.env.PORT || 8000);
});

module.exports = { userSocketIds };
