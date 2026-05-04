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
  MAILERSEND_FROM_EMAIL: optional("MAILERSEND_FROM_EMAIL", "noreply@rhythm.you"),
  MAILERSEND_FROM_NAME: optional("MAILERSEND_FROM_NAME", "The New Human Project"),
  YVP_APP_KEY: optional("YVP_APP_KEY", ""),
  // 111 = NIV (English) — license must be accepted on the YVP Platform Portal
  // 43  = CSBS (中文标准译本)
  YVP_BIBLE_ID_EN: optional("YVP_BIBLE_ID_EN", "111"),
  YVP_BIBLE_ID_ZH: optional("YVP_BIBLE_ID_ZH", "43"),
};
