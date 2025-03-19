// src/controllers/messageController.js
const { loadMessages } = require("../services/messageLoader");

const getMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    console.log("getMessages: roomId:", roomId);
    const messages = await loadMessages(roomId);
    console.log("getMessages: messages type:", typeof messages);
    console.log("getMessages: messages content:", messages);
    res.json(messages);
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({ error: "Failed to load messages" });
  }
};

module.exports = {
  getMessages,
};
