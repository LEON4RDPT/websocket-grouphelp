const { Dropbox } = require("dropbox");

let fetch; // will hold the node-fetch default export

// Helper: Refresh the access token
async function refreshAccessToken(dbx) {
  try {
    const refreshResponse = await dbx.authTokenRefresh();
    const newAccessToken = refreshResponse.result.access_token;
    console.log("New access token:", newAccessToken);
    // Optionally, update your persistent storage with the new token.
    return newAccessToken;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw error;
  }
}

// Helper: Load node-fetch dynamically
async function getFetch() {
  if (!fetch) {
    const fetchModule = await import("node-fetch");
    fetch = fetchModule.default;
  }
  return fetch;
}

async function storeMessage(newMessage) {
  // Ensure fetch is loaded
  await getFetch();

  // Initialize Dropbox client with your credentials
  let dbx = new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,      // short-lived token
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN,    // refresh token
    clientId: process.env.DROPBOX_CLIENT_ID,            // your Dropbox app key
    clientSecret: process.env.DROPBOX_CLIENT_SECRET,    // your Dropbox app secret
    fetch,
  });

  // Extract roomId and remove it from the message object
  const { roomId, ...messageWithoutRoom } = newMessage;
  // File name based on room ID; Dropbox paths need to start with a slash
  const filePath = roomId ? `/${roomId}.json` : "/message.json";

  let messages = [];
  try {
    // Try to download the file from Dropbox
    const downloadResponse = await dbx.filesDownload({ path: filePath });
    const fileContent = downloadResponse.result.fileBinary.toString();
    messages = JSON.parse(fileContent);
  } catch (error) {
    console.log("File not found or error reading file; will create new one.");
  }

  // Append the new message (without roomId)
  messages.push(messageWithoutRoom);

  try {
    // Attempt to upload the updated file to Dropbox
    const uploadResponse = await dbx.filesUpload({
      path: filePath,
      contents: JSON.stringify(messages, null, 2),
      mode: { ".tag": "overwrite" },
    });
    console.log("File uploaded to Dropbox:", uploadResponse.result.path_display);
  } catch (error) {
    // If error indicates token expiry, try to refresh and re-upload
    if (
      error.error &&
      typeof error.error.error_summary === "string" &&
      error.error.error_summary.includes("expired_access_token")
    ) {
      console.log("Access token expired. Refreshing token...");
      const newAccessToken = await refreshAccessToken(dbx);
      // Reinitialize Dropbox client with the new token
      dbx = new Dropbox({
        accessToken: newAccessToken,
        refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
        clientId: process.env.DROPBOX_CLIENT_ID,
        clientSecret: process.env.DROPBOX_CLIENT_SECRET,
        fetch,
      });
      try {
        const uploadResponse = await dbx.filesUpload({
          path: filePath,
          contents: JSON.stringify(messages, null, 2),
          mode: { ".tag": "overwrite" },
        });
        console.log("File uploaded to Dropbox after token refresh:", uploadResponse.result.path_display);
      } catch (retryError) {
        console.error("Error uploading file after token refresh:", retryError);
      }
    } else {
      console.error("Error uploading file to Dropbox:", error);
    }
  }
}

module.exports = {
  storeMessage,
};
