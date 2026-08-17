const crypto = require("crypto");

const SCRYPT_KEYLEN = 64;
const PASSWORD_HASH_PEPPER = process.env.PASSWORD_HASH_PEPPER || "";

function scryptAsync(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(`${password}${PASSWORD_HASH_PEPPER}`, salt, SCRYPT_KEYLEN, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scryptAsync(String(password || ""), salt);
  return {
    salt,
    hash: hash.toString("hex"),
    algorithm: "scrypt-v1",
  };
}

async function verifyPassword(password, salt, expectedHash) {
  if (!salt || !expectedHash) return false;
  const actual = await scryptAsync(String(password || ""), salt);
  const expected = Buffer.from(String(expectedHash), "hex");
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

async function validateNewPassword({ username, currentPassword, newPassword, confirmPassword }) {
  const password = String(newPassword || "");
  if (password.length < 8) return "La nueva contrasena debe tener al menos 8 caracteres.";
  if (password !== String(confirmPassword || "")) return "La confirmacion no coincide.";
  if (password === String(username || "")) return "La nueva contrasena no puede ser igual a la cedula.";
  if (password === String(currentPassword || "")) return "La nueva contrasena no puede ser igual a la contrasena anterior.";
  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  validateNewPassword,
};
