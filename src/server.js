require("dotenv").config();
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const { handleConnection } = require("./controllers/chatController");

const app = express();
const PORT = process.env.PORT || 443;

app.use(cors());

const server = app.listen(PORT, () => {
    console.log(`Servidor WebSocket rodando em http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on("connection", handleConnection);
