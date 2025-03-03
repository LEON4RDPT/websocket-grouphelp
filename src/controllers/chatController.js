const userService = require("../services/userService");

const handleConnection = (ws) => {
    let userId = null;
    let username = null;
    let userImage = null;

    ws.on("message", (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === "CONNECT" && data.userId) {
                userId = data.userId;
                username = data.username || `USER${userId}`;
                userImage = data.image || "/default-avatar.png";

                userService.addUser(userId, { ws, userId, username, image: userImage });
                console.log(`Usuário conectado: ${username} (ID: ${userId})`);

                ws.send(JSON.stringify({ type: "ASSIGN_USERNAME", username }));
                sendUserList();

            } else if (data.type === "REQUEST_USER_LIST") {
                ws.send(JSON.stringify({ type: "USER_LIST", users: userService.getAllUsers() }));

            } else if (data.recipient && userService.getUser(data.recipient)) {
                const recipientClient = userService.getUser(data.recipient);
                if (recipientClient.ws.readyState === 1) {
                    recipientClient.ws.send(JSON.stringify({
                        sender: username,
                        message: data.message,
                        image: userImage
                    }));
                }

                ws.send(JSON.stringify({
                    sender: "Eu",
                    message: data.message,
                    image: userImage
                }));

            } else if (data.message) {
                userService.broadcast({
                    sender: username,
                    message: data.message,
                    image: userImage
                });
            }
        } catch (error) {
            console.error("Erro ao processar mensagem:", error);
        }
    });

    ws.on("close", () => {
        if (userId) {
            console.log(`Usuário desconectado: ${username} (ID: ${userId})`);
            userService.removeUser(userId);
            sendUserList();
        }
    });
};

const sendUserList = () => {
    const userList = userService.getAllUsers();
    userService.broadcast({ type: "USER_LIST", users: userList });
};

module.exports = {
    handleConnection
};
