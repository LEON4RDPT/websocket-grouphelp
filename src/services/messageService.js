require("dotenv").config();
const admin = require("firebase-admin");
const { Datastore } = require("@google-cloud/datastore");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// ✅ Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Parse the service account credentials from the environment variable
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
console.log(datastoreClient);


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
      console.log(`✅ Added message to existing room: ${roomId || 'global'}`);
    } else {
      await datastoreClient.save(entity);
      console.log(`✅ Message stored successfully for room: ${roomId || 'global'}`);
    }
  } catch (error) {
    console.error('❌ Error storing message in Datastore:', error);
  }
}

// 🔹 Retrieve Messages Function (Datastore) using roomId
async function loadMessages(roomId = 'global') {
  console.log(`🔍 Fetching messages for room: ${roomId}`);

  // Create the key for the Room entity
  const key = datastoreClient.key(['Room', roomId]);

  try {
    // Retrieve the room entity
    const [room] = await datastoreClient.get(key);

    if (!room) {
      console.log('⚠️ No messages found for this room; returning an empty array.');
      return [];
    }

    // Return the messages stored in the room
    const messages = room.messages || [];
    
    console.log('✅ Retrieved messages:', messages);
    return messages;
  } catch (error) {
    console.error('❌ Error fetching messages from Datastore:', error);
    throw error;
  }
}

module.exports = { storeMessage, loadMessages };
