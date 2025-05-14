require("dotenv").config();
const fs = require("fs");
const admin = require("firebase-admin");
const { Datastore } = require("@google-cloud/datastore");
const serviceAccountPath = "./pass.json"; // Path to your service account JSON file
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));const { decryptToken } = require("../utils/crypt"); // ajusta o caminho se for diferente


// ✅ Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Parse the service account credentials from the environment variable
  console.log('Service Account:', serviceAccount);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  });
}

// ✅ Initialize Google Cloud Datastore client
const datastoreClient = new Datastore({
  credentials: serviceAccount,
});
console.log('Datastore client initialized with projectId:', serviceAccount.project_id);


// 🔹 Store Message Function (Datastore) with roomId as the key
async function storeMessage(newMessage) {
  const { roomId, ...messageWithoutRoom } = newMessage;
  messageWithoutRoom.timestamp = new Date().toISOString();

  // Use roomId as the key for the Datastore entity
  const key = datastoreClient.key(["Room", roomId]);


  const entity = {
    key,
    data: {
      roomId: roomId || "global", // Default to 'global' if no roomId is provided
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
    console.error('❌ Error storing message in Datastore:', error);
  }
}

// 🔹 Retrieve Messages Function (Datastore) using roomId
async function loadMessages(roomId = 'global') {

  // Create the key for the Room entity
  const key = datastoreClient.key(['Room', roomId]);

  try {
    // Retrieve the room entity
    const [room] = await datastoreClient.get(key);

    if (!room) {
      return [];
    }

    // Return the messages stored in the room
    const messages = (room.messages || []).map(msg => ({
      ...msg,
      message: decryptToken(msg.message)
    }));

    return messages;

  } catch (error) {
    console.error('❌ Error fetching messages from Datastore:', error);
    throw error;
  }
}

module.exports = { storeMessage, loadMessages };
