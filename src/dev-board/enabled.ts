// The design board is for local development only. It is off in every production
// build, and off on any Vercel deployment (preview or production).
export function isBoardEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && !process.env.VERCEL && !process.env.VERCEL_ENV;
}

// "Local DB data" mode may read only a Postgres on this computer. Any other
// database (Neon, PlanetScale, a remote host) switches it off.
export function isLocalDatabase(): boolean {
  if (process.env.DATABASE_PROVIDER !== "local") return false;
  try {
    const host = new URL(process.env.DATABASE_URL ?? "").hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
  } catch {
    return false;
  }
}

export function isBoardLiveDataEnabled(): boolean {
  return isBoardEnabled() && isLocalDatabase();
}

export const BOARD_USER_COOKIE = "board_user";
