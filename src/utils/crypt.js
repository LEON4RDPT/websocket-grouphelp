const CryptoJS = require("crypto-js");

function encryptToken(text) {
  const key = process.env.CRYPTO_JS_KEY;
  if (!key) {
    throw new Error("Chave de criptografia não definida.");
  }
  const encrypted = CryptoJS.AES.encrypt(text, key).toString();
  return encrypted;
}


function decryptToken(ciphertext) {
  const key = process.env.CRYPTO_JS_KEY;
  if (!key) {
    throw new Error("Chave de criptografia não definida.");
  }
  const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
  return decrypted.toString(CryptoJS.enc.Utf8);
}

module.exports = {
  encryptToken,
  decryptToken,
};

