const router = require("express").Router();
const bcrypt = require("bcrypt");
const { ObjectId } = require("mongoose").Types;
const Chat = require("../model/chat-app/chat.models");
const User = require("../model/User");
const ChatMessage = require("../model/chat-app/message.models");
const multer = require("multer");
const { uploadFilesOnClodenary } = require("../Utils/commanf");
const upload = require("../middleware/upload");
const { v4: uuid } = require("uuid");
const {
  ALERT,
  REFETCH_CHAT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  NEW_MESSAGE,
} = require("../constants/events");
const {
  deleteFilesFromCloudinary,
  getUsejrDetails,
} = require("../Utils/commanf");

const eventFunction = require("../index");

router.post("/create-group", async (req, res) => {
  try {
    const { name, participants, admin } = req.body;
    // Create a new group chat
    if (participants.length < 2) {
      return res
        .status(400)
        .json({ error: "Group chat must have at least 3 participants" });
    }
    participants.push(admin);
    const newChat = new Chat({
      name,
      isGroupChat: true,
      participants,
      admin,
    });

    // Save the new chat to the database
    await newChat.save();
    eventFunction.emitEventfun(
      req,
      ALERT,
      participants,
      `Welcome to ${name} group`
    );
    eventFunction.emitEventfun(req, REFETCH_CHAT, participants);
    res.status(200).json({
      status: true,
      message: "Group chat created successfully",
      chat: newChat,
    });
  } catch (error) {
    console.error("Error creating group chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// get my chatlist
router.get("/get_my_chat/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find chats where the user is a participant
    const chats = await Chat.find({ participants: userId }).populate({
      path: "participants",
      select: "username profilePic", // Select only necessary fields
    });

    res.status(200).json({ status: true, chats });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// getMyGropChats
router.get("/getMyGropChats/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find chats where the user is a participant
    const chats = await Chat.find({ admin: userId }).populate({
      path: "participants",
      select: "username profilePic", // Select only necessary fields
    });

    res.status(200).json({ status: true, chats });
  } catch (error) {
    console.error("Error fetching user chats:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// add member in group chat
router.post("/add-member/:chatId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { chatId } = req.params;

    // Validate request body
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the chat by chatId
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Check if the chat is a group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({ error: "This chat is not a group chat" });
    }

    // Check if the user is already a member of the chat
    if (chat.participants.includes(userId)) {
      return res
        .status(400)
        .json({ error: "User is already a member of the chat" });
    }

    // Add the user to the participants array of the chat
    chat.participants.push(userId);
    await chat.save();
    const username = await getUserDetails(userId);
    eventFunction.emitEventfun(
      req,
      ALERT,
      chat.participants,
      `Welcome to ${username.username} group`
    );
    eventFunction.emitEventfun(req, REFETCH_CHAT, chat.participants);
    res.status(200).json({
      status: true,
      message: "User added to the chat successfully",
      chat,
    });
  } catch (error) {
    console.error("Error adding member to chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//   remove member from group chat
router.post("/remove-member/:chatId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { chatId } = req.params;

    // Validate request body
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the chat by chatId
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Check if the chat is a group chat
    if (!chat.isGroupChat) {
      return res.status(400).json({ error: "This chat is not a group chat" });
    }

    // Check if the user is a member of the chat
    if (!chat.participants.includes(userId)) {
      return res
        .status(400)
        .json({ error: "User is not a member of the chat" });
    }

    const index = chat.participants.indexOf(userId);
    if (index === -1) {
      return res
        .status(400)
        .json({ error: "User is not a member of the chat" });
    }

    // Remove the user from the participants array of the chat
    chat.participants.splice(index, 1);
    await chat.save();
    const username = await getUserDetails(userId);
    eventFunction.emitEventfun(
      req,
      ALERT,
      chat.participants,
      `${username.username} has been removed from the group`
    );
    eventFunction.emitEventfun(req, REFETCH_CHAT, chat.participants);

    res.status(200).json({
      status: true,
      message: "User removed from the chat successfully",
      chat,
    });
  } catch (error) {
    console.error("Error removing member from chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to leave a group chat
router.post("/leave-group/:chatId", async (req, res) => {
  try {
    const { userId } = req.body;
    const { chatId } = req.params;

    // Validate request body
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Find the user by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the chat by chatId
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    // Check if the user is a member of the chat
    const index = chat.participants.indexOf(userId);
    if (index === -1) {
      return res
        .status(400)
        .json({ error: "User is not a member of the chat" });
    }

    // Check if the user is the admin of the chat
    if (chat.admin.toString() === userId) {
      // If the user is the admin, disallow leaving the group unless they are transferring admin rights
      if (chat.participants.length === 1) {
        // Only admin is left, delete the chat
        await Chat.findByIdAndDelete(chatId);
        return res
          .status(200)
          .json({ status: true, message: "Chat deleted successfully" });
      } else {
        return res.status(400).json({
          error: "You cannot leave the group without transferring admin rights",
        });
      }
    }

    // Remove the user from the participants array of the chat
    chat.participants.splice(index, 1);
    await chat.save();

    res
      .status(200)
      .json({ status: true, message: "User left the chat successfully" });
  } catch (error) {
    console.error("Error leaving group chat:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//   send attchament in chat message
router.post("/send-attachments", async (req, res) => {
  upload.array("files", 5)(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      return res.status(400).json({ error: "Multer error" });
    } else if (err) {
      console.error("Error uploading files:", err);
      return res.status(500).json({ error: "Error uploading files" });
    }

    try {
      const files = req.files || [];

      console.log(files, "======files====");

      const attachments = await uploadFilesOnClodenary(files);

      const { sender, content, chatId } = req.body;
      const [chat] = await Promise.all([Chat.findById(chatId)]);
      console.log(sender, content, chatId, "=====data from postman");
      const user = await User.findById(sender);
      const newMessage = new ChatMessage({
        sender: {
          _id: user._id,
          username: user.username,
        },
        content,
        attachments,
        chat: chatId,
      });

      console.log(newMessage, "===new message====");
      // Save the chat message to the database
      await newMessage.save();
      const messageForRealTime = {
        _id: newMessage._id,
        sender: {
          _id: user._id,
          username: user.username,
        },
        content,
        attachments,
        chat: chatId,
        createdAt: new Date().toISOString(),
      };
      // const message = await
      eventFunction.emitEventfun(
        req,
        NEW_MESSAGE,
        chat.participants,
        messageForRealTime,
        chatId
      );

      eventFunction.emitEventfun(req, NEW_MESSAGE_ALERT, chat.participants, {
        chatId,
      });

      res.status(200).json({
        status: true,
        message: "Chat message with attachments sent successfully",
        files: attachments,
      });
    } catch (error) {
      console.error("Error sending chat message with attachments:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
});

// get chat details , rename , delete
router.get("/getchat/:id", async (req, res) => {
  if (req.query.populate == "true") {
    const chat = await Chat.findById(req.params.id)
      .populate({
        path: "participants",
        select: "username profilePic", // Select only necessary fields
      })
      .lean();
    if (!chat) return res.status(404).json({ message: "Chat not found" });
    // eventFunction.emitEventfun(req, ALERT, participants, `Welcome to ${name} group`);
    // eventFunction.eventFunction.emitEventfun()

    return res.status(200).json({ success: true, chat });
  } else {
    const chat = await Chat.findById(req.params.id);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    return res.status(200).json({ success: true, chat });
  }
});

// rename group
router.post("/rename-group", async (req, res) => {
  try {
    // Validate request body
    const { groupId, newName, userId } = req.body;
    if (!groupId || !newName || !userId) {
      return res
        .status(400)
        .json({ error: "Group ID, new name, and user ID are required" });
    }

    // Check if the group exists
    const existingGroup = await Chat.findById(groupId);
    if (!existingGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if the user is a member of the group
    const isMember = existingGroup.participants.includes(userId);
    if (!isMember) {
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });
    }

    // Update the name of the group
    existingGroup.name = newName;
    await existingGroup.save();

    res.status(200).json({
      status: true,
      message: "Group renamed successfully",
      group: existingGroup,
    });
  } catch (error) {
    console.error("Error renaming group:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint for deleting a group chat
router.delete("/delete-group/:groupId", async (req, res) => {
  try {
    // Extract group ID and user ID from request parameters
    const { groupId } = req.params;
    const { userId } = req.body;
    const chat = await Chat.findById(groupId);
    // Check if the user is the admin of the group
    const existingGroup = await Chat.findById(groupId);
    if (!existingGroup) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (existingGroup.admin.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only the admin can delete the group" });
    }

    // Delete the group chat and related chat messages
    const messageWithAttachments = await ChatMessage.find({
      chat: groupId,
      attachmentUrls: { $exists: true, $ne: [] },
    });
    const publicIDs = [];
    messageWithAttachments.forEach(({ attachments }) => {
      attachments.forEach(({ public_id }) => {
        publicIDs.push(public_id);
      });
    });

    // time stamp 3.33 in part two
    // also find
    await deleteFilesFromCloudinary(publicIDs);
    await Chat.findByIdAndDelete(groupId);
    await ChatMessage.deleteMany({ chat: groupId });

    console.log(chat.participants);
    eventFunction.emitEventfun(req, REFETCH_CHAT, chat.participants);

    res.status(200).json({
      status: true,
      message: "Group chat and associated messages deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting group chat and messages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Message
router.get("/message/:id", async (req, res) => {
  try {
    const chatId = req.params.id;
    const { page = 1 } = req.query;

    const limit = 20;
    const skip = (page - 1) * limit;

    const [messages, totalMessageCount] = await Promise.all([
      ChatMessage.find({ chat: chatId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: "sender",
          select: "username profilePic", // Select only necessary fields
        })
        .lean(),
      ChatMessage.countDocuments({ chat: chatId }),
    ]);

    const totalPages = Math.ceil(totalMessageCount / limit);

    return res
      .status(200)
      .json({ status: true, message: messages.reverse(), totalPages });
  } catch (error) {
    console.error("Error getting message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//   send attchament in chat message
// router.post("/message", async (req, res) => {
//   try {

//       console.log( req.body, "====chat id ==");
//     const { chatId } = req.body;

// const [chat, me] = await Promise.all([
//   Chat.findById(chatId),
//   Chat.findById(chatId),
//   User.findById(req.user, "name"),
// ]);

//     const files = req.files || [];

//     if (!chat) {
//       return res.status(404).json({ error: "Chat not found" });
//     }

//     if (files.length < 1)
//       return res.status(404).json({ error: "Please Provide Files" });

//       return  res
//       .status(200)
//       .json({ message: "User added to the chat successfully", chat });
// const attachment = [];
// const messageForRealTime = {
//   content: "",
//   attachment,
//   sender: { _id: me._id, name: me.name },
//   chat:chatId,
// };

// const messageForDb = { content: "", attachment, sender: me._id, chat:chatId };

// // const message = await
// eventFunction.emitEventfun(
//   req,
//   NEW_ATTACHMENT,
//   chat.participants,
//   { message: messageForRealTime },
//   chatId
// );

// eventFunction.emitEventfun(req, NEW_MESSAGE_ALERT, chat.participants, { chatId });

//     res
//       .status(200)
//       .json({ message: "User added to the chat successfully", chat });
//   } catch (error) {
//     console.error("Error leaving group chat:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

module.exports = router;