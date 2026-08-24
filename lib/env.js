const fs = require("fs");
const path = require("path");

function parseEnvValue(value) {
  const trimmed = String(value || "").trim();
  const isQuoted =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return isQuoted ? trimmed.slice(1, -1).replace(/\\n/g, "\n") : trimmed;
}

function loadEnvFile(filePath = path.join(__dirname, "..", ".env")) {
  if (!fs.existsSync(filePath)) return false;

  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 0) continue;

    const key = line.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] != null) continue;

    process.env[key] = parseEnvValue(line.slice(separatorIndex + 1));
  }

  return true;
}

loadEnvFile();

function getServerConfig() {
  return {
    port: process.env.PORT || 3000,
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    storageDriver: (process.env.STORAGE_DRIVER || "auto").toLowerCase(),
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    nodeEnv: process.env.NODE_ENV || "development",
    appSessionSecret: process.env.APP_SESSION_SECRET || "",
    passwordHashPepper: process.env.PASSWORD_HASH_PEPPER || "",
    bootstrapAdminEnabled: String(process.env.BOOTSTRAP_ADMIN_ENABLED || "false").toLowerCase() === "true",
    bootstrapAdminUsername: process.env.BOOTSTRAP_ADMIN_USERNAME || "admin",
    bootstrapAdminPassword: process.env.BOOTSTRAP_ADMIN_PASSWORD || "",
  };
}

module.exports = {
  loadEnvFile,
  getServerConfig,
};
