// Manage connected users
const clients = new Map();

const addUser = (userId, userData) => {
    clients.set(userId, userData);
};

const removeUser = (userId) => {
    clients.delete(userId);
};

const getUser = (userId) => {
    return clients.get(userId);
};

const getAllUsers = () => {
    return Array.from(clients.values()).map(client => ({
        userId: client.userId,
        username: client.username,
        image: client.image || "/default-avatar.png"
    }));
};

const broadcast = (message) => {
    clients.forEach(client => {
        if (client.ws.readyState === 1) {  // WebSocket.OPEN
            client.ws.send(JSON.stringify(message));
        }
    });
};

module.exports = {
    addUser,
    removeUser,
    getUser,
    getAllUsers,
    broadcast
};
