export const ADMIN_AUTH_COOKIE = "erp_admin_auth";

export function getAdminCredentials() {
  return {
    userId: process.env.ADMIN_USER_ID ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "admin123",
  };
}

export function isValidAdminLogin(userId: string, password: string) {
  const creds = getAdminCredentials();
  return userId === creds.userId && password === creds.password;
}
