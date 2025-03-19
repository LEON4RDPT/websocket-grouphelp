const { Dropbox } = require("dropbox");

let fetch; // will hold the node-fetch default export
async function getFetch() {
  if (!fetch) {
    const fetchModule = await import("node-fetch");
    fetch = fetchModule.default;
  }
  return fetch;
}

// Helper function to check if a file exists on Dropbox
async function fileExists(dbx, filePath) {
  try {
    await dbx.filesGetMetadata({ path: filePath });
    return true;
  } catch (error) {
    if (
      error &&
      error.error &&
      error.error.error_summary &&
      error.error.error_summary.startsWith("path/not_found/")
    ) {
      return false;
    }
    throw error;
  }
}

async function loadMessages(roomId) {
  await getFetch();
  // Initialize Dropbox client with your access token and dynamically imported fetch
  const dbx = new Dropbox({ accessToken: process.env.DROPBOX_ACCESS_TOKEN, fetch });
  // Construct the Dropbox file path (must start with a slash)
  const filePath = roomId ? `/${roomId}.json` : "/message.json";

  // Check if the file exists by looking through all files in the target location.
  const exists = await fileExists(dbx, filePath);
  if (!exists) {
    console.log("File not found; returning empty array.");
    return [];
  }

  try {
    // Download the file from Dropbox
    const downloadResponse = await dbx.filesDownload({ path: filePath });
    // Convert the file binary to a string (assuming UTF-8)
    const fileContent = Buffer.isBuffer(downloadResponse.result.fileBinary)
      ? downloadResponse.result.fileBinary.toString("utf8")
      : downloadResponse.result.fileBinary;
    // Parse and return the JSON content
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error downloading file:", error);
    throw error;
  }
}

module.exports = {
  loadMessages,
};
