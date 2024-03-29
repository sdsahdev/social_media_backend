const User = require("../model/User");
const Chat = require("../model/chat-app/chat.models");
const ChatMessage = require("../model/chat-app/message.models");
const { faker, simpleFaker } = require("@faker-js/faker");


const getRandomUserIds = async (numUsers) => {
    try {
      const users = await User.find({}, '_id'); // Fetch all user IDs from the database
      const userIds = users.map(user => user._id); // Extract user IDs from the fetched users
      // Shuffle the array of user IDs
      for (let i = userIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [userIds[i], userIds[j]] = [userIds[j], userIds[i]];
      }
      // Return a slice of the shuffled array containing the specified number of user IDs
      return userIds.slice(0, numUsers);
    } catch (error) {
      console.error('Error fetching user IDs:', error);
      return [];
    }
  };

const createSignleChat = async (chatcount) => {
    try {
        const chatGroups = [];
        for (let i = 0; i < chatcount; i++) {
          const isGroupChat = false; // Generate a random group name
          const name = faker.internet.userName(); // Generate a random group name
          const participants = await getRandomUserIds(2);
          const newChat = new Chat({ name, participants ,isGroupChat});
          chatGroups.push(await newChat.save());
        }
        console.log(`fake chat created successfully.`);
        return chatGroups;
      } catch (error) {
        console.error('Error generating fake chat groups:', error);
        return [];
      }
};

const createGroupChat = async (chatcount) => {
    try {
        const chatGroups = [];
        for (let i = 0; i < chatcount; i++) {
          const isGroupChat = true; // Generate a random group name
          const name = faker.internet.userName(); // Generate a random group name
          const participants = await getRandomUserIds(3);
          const admin = participants[Math.floor(Math.random() * participants.length)]; // Select a random participant as admin
          const newChat = new Chat({ name, admin, participants ,isGroupChat});
          chatGroups.push(await newChat.save());
        }
        console.log(` fake chat groups created successfully.`);
        return chatGroups;
      } catch (error) {
        console.error('Error generating fake chat groups:', error);
        return [];
      }
};

const createMessages = async (chatId, numMessages) => {
    try {
        const chatMessages = [];
        for (let i = 0; i < numMessages; i++) {
          const sender = await getRandomUserIds(1); // Select a random user ID as sender
          const content = faker.lorem.sentence(); // Generate a random message content
          const newMessage = new ChatMessage({ sender, content, chat: chatId });
          chatMessages.push(await newMessage.save());
        }
        console.log(`${numMessages} fake chat messages created for chat ${chatId} successfully.`);
        return chatMessages;
      } catch (error) {
        console.error('Error generating fake chat messages:', error);
        return [];
      }
};


module.exports = { createSignleChat, createGroupChat, createMessages };
