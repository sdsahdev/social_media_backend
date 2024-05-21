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
const { v2: cloudinary } = require("cloudinary");
const ChatMessage = require("./model/chat-app/message.models");
const Chat = require("./model/chat-app/chat.models");
const multer = require("multer");
const {
  createSignleChat,
  createGroupChat,
  createMessages,
} = require("./seeders/users");
const {
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  START_TYPEING,
  STOP_TYPEING,
} = require("./constants/events");
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
const { verifyToken } = require("./middleware/auth");

const server = createServer(app);
const io = new Server(server);
// app.set("io", io);
const userSocketIds = new Map();
function verifyTokens(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}
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
  cloud_name: process.env.CLOUDNARY_CLOUD_NAME,
  api_key: process.env.CLOUDNARY_API_KEY,
  api_secret: process.env.CLOUDNARY_API_SECRET,
});
app.get("/", (req, res) => {
  res.send("Hello dev");
});

// **********************  SOKET CODE START LIVE ******************************************

io.on("connection", (socket) => {
  console.log("user connected");
  const token = socket.handshake.auth.token;
  const user = verifyTokens(token);
  console.log(user, "====current user====");

  userSocketIds.set(user.userId.toString(), socket.id);
  console.log(userSocketIds);
  socket.on(NEW_MESSAGE, async ({ chatId, participants, message }) => {
    const messageForRealTime = {
      content: message,
      _id: uuid(),
      sender: {
        _id: user.userId,
        username: user.username,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };
    console.log(typeof participants, "==members==");
    console.log(message, "==message==");
    const messageForDb = {
      content: message,
      sender: user.userId,
      chat: chatId,
    };
    2;
    const participantSocket = participants.map((user) =>
      userSocketIds.get(user.toString())
    );
    console.log(participantSocket, "==participants==");
    console.log(
      {
        chatId,
        message: messageForRealTime,
      },
      "==data=="
    );

    io.to(participantSocket).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealTime,
    });
    io.to(participantSocket).emit(NEW_MESSAGE_ALERT, {
      chatId,
      sender: user.userId,
    });
    try {
      // Save the message to the database
      const newMessage = await ChatMessage.create(messageForDb);

      // Retrieve the chat document associated with the message
      const chat = await Chat.findById(chatId);

      // Update the lastMessage field of the chat document
      chat.lastMessage = newMessage._id;

      // Save the updated chat document back to the database
      await chat.save();
    } catch (error) {
      console.log(error);
    }
  });

  socket.on(START_TYPEING, ({ participants, msgid }) => {
    const membersSockets = participants.map((user) => {
      return userSocketIds.get(user.toString()); // Return the result of get()
    });
    console.log("start typing", "*************************");
    socket.to(membersSockets).emit(START_TYPEING, { msgid });
  });
  socket.on(STOP_TYPEING, ({ participants, msgid }) => {
    const membersSockets = participants.map((user) => {
      return userSocketIds.get(user.toString()); // Return the result of get()
    });
    console.log("stop typing", "*************************");
    socket.to(membersSockets).emit(STOP_TYPEING, { msgid });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    userSocketIds.delete(user.userId.toString());
  });
});

app.use("/uploads", express.static("uploads"));
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
const emitEventfun = (req, event, users, data, chatId) => {
  const userSockets = users.map((user) => {
    return userSocketIds.get(user.toString()); // Return the result of get()
  });

  const message = data?.message;

  io.to(userSockets).emit(NEW_MESSAGE, {
    chatId,
    message,
  });
};
exports.emitEventfun = emitEventfun;
// http://localhost:8200/uploads/1711028675289_heart.png

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
