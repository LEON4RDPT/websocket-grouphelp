// Manage connected users
const clients = new Map();
// Manage room connections: key = room id, value = Map of user connections in that room
const rooms = new Map();

const addUser = (userId, userData) => {
  clients.set(userId, userData);
  // If userData includes a room, add them to that room
  if (userData.room) {
    if (!rooms.has(userData.room)) {
      rooms.set(userData.room, new Map());
    }
    rooms.get(userData.room).set(userId, userData);
  }
};

const removeUser = (userId) => {
  const userData = clients.get(userId);
  if (userData && userData.room) {
    const room = rooms.get(userData.room);
    if (room) {
      room.delete(userId);
      // Optionally remove the room if it's empty
      if (room.size === 0) {
        rooms.delete(userData.room);
      }
    }
  }
  clients.delete(userId);
};

const getUser = (userId) => {
  return clients.get(userId);
};

const getAllUsers = () => {
  return Array.from(clients.values()).map(client => ({
    userId: client.userId,
    username: client.username,
    image: client.image || "image/user.png",
    room: client.room || null
  }));
};

const broadcast = (message) => {
  // If the message includes a roomId, send only to that room's connections
  if (message.roomId && rooms.has(message.roomId)) {
    rooms.get(message.roomId).forEach(client => {
      if (client.ws.readyState === 1) {  // WebSocket.OPEN
        client.ws.send(JSON.stringify(message));
      }
    });
  } else {
    // Otherwise, broadcast to all connected users
    clients.forEach(client => {
      if (client.ws.readyState === 1) {  // WebSocket.OPEN
        client.ws.send(JSON.stringify(message));
      }
    });
  }
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getAllUsers,
  broadcast,
};
