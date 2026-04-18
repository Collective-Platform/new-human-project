function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  DATABASE_PROVIDER: optional("DATABASE_PROVIDER", "local") as
    | "local"
    | "neon",
  SESSION_SECRET: required("SESSION_SECRET"),
  VAPID_PUBLIC_KEY: optional("VAPID_PUBLIC_KEY", ""),
  VAPID_PRIVATE_KEY: optional("VAPID_PRIVATE_KEY", ""),
  MAILERSEND_API_KEY: optional("MAILERSEND_API_KEY", ""),
};
