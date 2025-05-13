require("dotenv").config();
const express = require("express");
const WebSocket = require("ws");
const cors = require("cors");
const { handleConnection } = require("./controllers/chatController");
const { getMessages } = require("./controllers/messageController");

const app = express();
const PORT = process.env.PORT || 8080;

const allowedOrigin = process.env.CLIENT_URL;

if (allowedOrigin) {
  app.use(cors({
    origin: allowedOrigin,
  }));
  console.log(`CORS restricted to: ${allowedOrigin}`);
} else {
  app.use(cors()); // allow all origins
  console.warn("⚠️ No CLIENT_URL set. CORS is open to all origins.");
}
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor WebSocket rodando em http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });

// Handle WebSocket connections
wss.on("connection", handleConnection);
app.get("/messages/:roomId", getMessages);
