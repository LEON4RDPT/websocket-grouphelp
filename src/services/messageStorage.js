  const { Dropbox } = require("dropbox");

  let fetch; // will hold the node-fetch default export

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

    // Initialize Dropbox client with your access token and dynamically imported fetch
    const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch });
    
    // Extract roomId and remove it from the message object
    const { roomId, ...messageWithoutRoom } = newMessage;
    // File name based on room ID; Dropbox paths need to start with a slash
    const filePath = roomId ? `/${roomId}.json` : "/message.json";

    let messages = [];
    try {
      // Try to download the file from Dropbox
      const downloadResponse = await dbx.filesDownload({ path: filePath });
      // The file content is returned in downloadResponse.result.fileBinary
      // Convert Buffer/string into JSON array
      const fileContent = downloadResponse.result.fileBinary.toString();
      messages = JSON.parse(fileContent);
    } catch (error) {
      console.log("File not found or error reading file; will create new one.");
    }

    // Append the new message (without roomId)
    messages.push(messageWithoutRoom);

    try {
      // Upload the updated file to Dropbox, using overwrite mode
      const uploadResponse = await dbx.filesUpload({
        path: filePath,
        contents: JSON.stringify(messages, null, 2),
        mode: { ".tag": "overwrite" },
      });
      console.log("File uploaded to Dropbox:", uploadResponse.result.path_display);
    } catch (error) {
      console.error("Error uploading file to Dropbox:", error);
    }
  }

  module.exports = {
    storeMessage,
  };
