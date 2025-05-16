// Import the user service and message storage
const userService = require("../services/userService");
const { storeMessage } = require("../services/messageService");
const { encryptToken } = require("../utils/crypt"); // ajuste o caminho se necessário

const handleConnection = (ws) => {
  let userId = null;
  let username = null;
  let userImage = null;
  let recipientId = null;

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === "CONNECT" && data.userId) {
        userId = data.userId;
        username = data.username || data.userId;
        userImage = data.image || "/image/user.png";
        recipientId = data.recipientId;

        userService.addUser(userId, { ws, userId, username, image: userImage });

        ws.send(JSON.stringify({ type: "ASSIGN_USERNAME", username }));
        sendUserList();

      } else if (data.type === "REQUEST_USER_LIST") {
        ws.send(JSON.stringify({ type: "USER_LIST", users: userService.getAllUsers() }));

      } else if (data.recipientId && userService.getUser(data.recipientId)) {
        // Private message
        const recipientClient = userService.getUser(data.recipientId);
        if (recipientClient.ws.readyState === 1) {
          recipientClient.ws.send(JSON.stringify({
            senderId: userId,
            sender: username,
            message: data.message,
            image: userImage,
          }));
        }

        // Store the private message using only senderId
        storeMessage({
          senderId: userId,
          roomId: data.recipientId,
          message: encryptToken(data.message),
          timestamp: new Date().toISOString()
        });

        // Echo back to sender
        ws.send(JSON.stringify({
          senderId: userId,
          sender: "Eu",
          message: data.message,
          image: userImage
        }));

      } else if (data.message) {
        // Broadcast message
        userService.broadcast({
          senderId: userId,
          sender: username,
          message: data.message,
          image: userImage
        });

        // Store the broadcast message with only senderId
        storeMessage({
          senderId: userId,
          message: encryptToken(data.message),
          timestamp: new Date().toISOString(),
          roomId: recipientId,
          username: username,
          userImage: userImage || "/image/user.png",

        });
      }
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
    }
  });

  ws.on("close", () => {
    if (userId) {
      userService.removeUser(userId);
      sendUserList();
    }
  });
};

function sendUserList() {
  const userList = userService.getAllUsers();
  userService.broadcast({ type: "USER_LIST", users: userList });
}

module.exports = {
  handleConnection,
};
