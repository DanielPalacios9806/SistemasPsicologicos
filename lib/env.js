function getServerConfig() {
  return {
    port: process.env.PORT || 3000,
    googleClientId: process.env.GOOGLE_CLIENT_ID || "",
    adminUsername: process.env.ADMIN_USERNAME || "admin",
    adminPassword: process.env.ADMIN_PASSWORD || "admin123",
    storageDriver: (process.env.STORAGE_DRIVER || "auto").toLowerCase(),
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };
}

module.exports = {
  getServerConfig,
};
