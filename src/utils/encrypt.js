// utils/encrypt.js

import CryptoJS from "crypto-js";

const SECRET = process.env.TOKEN_SECRET;

export const encrypt = (text) => {
  return CryptoJS.AES.encrypt(text, SECRET).toString();
};

export const decrypt = (cipher) => {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET);
  return bytes.toString(CryptoJS.enc.Utf8);
};
