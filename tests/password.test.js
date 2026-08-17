const test = require("node:test");
const assert = require("node:assert/strict");

const { hashPassword, verifyPassword, validateNewPassword } = require("../lib/auth/password");

test("passwords are stored as salted scrypt hashes", async () => {
  const password = await hashPassword("1712345678");
  assert.notEqual(password.hash, "1712345678");
  assert.ok(password.salt.length >= 16);
  assert.equal(await verifyPassword("1712345678", password.salt, password.hash), true);
  assert.equal(await verifyPassword("wrong", password.salt, password.hash), false);
});

test("new password policy rejects cedula, repeated and short passwords", async () => {
  assert.match(
    await validateNewPassword({
      username: "1712345678",
      currentPassword: "1712345678",
      newPassword: "1712345678",
      confirmPassword: "1712345678",
    }),
    /cedula|anterior/
  );
  assert.match(
    await validateNewPassword({
      username: "1712345678",
      currentPassword: "1712345678",
      newPassword: "abc",
      confirmPassword: "abc",
    }),
    /8 caracteres/
  );
});
