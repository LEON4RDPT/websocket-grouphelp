require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const admin = require("firebase-admin");
const { Datastore } = require("@google-cloud/datastore");
const { decryptToken } = require("../utils/crypt");

let datastoreClient;

async function loadServiceAccount() {
  const gistUrl = "https://gist.githubusercontent.com/LEON4RDPT/dbb80bf459d97f319c2328b11812a328/raw/c2bb9989402d5a0ce3e45d15199c52c49d8f03a9/gistfile1.txt";
  try {
    const response = await axios.get(gistUrl, {
      headers: { Accept: "application/json" },
    });
    return response.data;
  } catch (err) {
    console.error("❌ Failed to load service account from Gist, falling back to local file:", err.message);
    const serviceAccountPath = "./pass.json";
    return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  }
}

async function initialize() {
  const serviceAccount = await loadServiceAccount();

  // Initialize Firebase Admin SDK
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
      databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    });
  }

  // Initialize Google Cloud Datastore client
  datastoreClient = new Datastore({
    credentials: serviceAccount,
  });
}

// 🔹 Store Message Function
async function storeMessage(newMessage) {
  if (!datastoreClient) await initialize();

  const { roomId, ...messageWithoutRoom } = newMessage;
  messageWithoutRoom.timestamp = new Date().toISOString();

  const key = datastoreClient.key(["Room", roomId]);

  const entity = {
    key,
    data: {
      roomId: roomId || "global",
      messages: [messageWithoutRoom],
    },
  };

  try {
    const [existingEntity] = await datastoreClient.get(key);
    if (existingEntity) {
      existingEntity.messages.push(messageWithoutRoom);
      await datastoreClient.save(existingEntity);
    } else {
      await datastoreClient.save(entity);
    }
  } catch (error) {
    console.error("❌ Error storing message in Datastore:", error);
  }
}

// 🔹 Load Messages Function
async function loadMessages(roomId = "global") {
  if (!datastoreClient) await initialize();

  const key = datastoreClient.key(["Room", roomId]);

  try {
    const [room] = await datastoreClient.get(key);
    if (!room) return [];

    return (room.messages || []).map((msg) => ({
      ...msg,
      message: decryptToken(msg.message),
    }));
  } catch (error) {
    console.error("❌ Error fetching messages from Datastore:", error);
    throw error;
  }
}

module.exports = { storeMessage, loadMessages };
