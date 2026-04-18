-- Local Development Database Setup
-- Creates the giving-platform shared tables locally so development
-- doesn't require access to the production database.
-- These tables already exist in production — DO NOT run this in production.

-- Users table (giving-platform)
CREATE TABLE IF NOT EXISTS users (
    id serial PRIMARY KEY,
    email varchar(254) NOT NULL,
    email_verified_at timestamptz,
    first_name varchar(32),
    last_name varchar(32),
    role text NOT NULL DEFAULT 'user',
    status text NOT NULL DEFAULT 'guest',
    journey text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON users (email);

-- Formation-specific columns added to the shared users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_handle text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS church_id uuid;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS push_subscription jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{"daily_reminder": true, "reminder_time": "08:00", "friend_requests": true}'::jsonb;
ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_public boolean DEFAULT true;
CREATE UNIQUE INDEX IF NOT EXISTS users_search_handle_idx ON users (search_handle);

-- Sessions table (giving-platform)
CREATE TABLE IF NOT EXISTS sessions (
    id varchar(21) PRIMARY KEY,
    token_hash varchar(255) NOT NULL,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions (token_hash);

-- Tokens table (giving-platform)
CREATE TABLE IF NOT EXISTS tokens (
    id serial PRIMARY KEY,
    token_hash varchar(255) NOT NULL,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mode text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS tokens_token_hash_user_id_idx ON tokens (token_hash, user_id);
CREATE INDEX IF NOT EXISTS tokens_user_id_expires_at_used_at_created_at_idx ON tokens (user_id, expires_at, used_at, created_at);

-- User settings table (giving-platform)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    privacy_mode boolean NOT NULL DEFAULT false
);

-- Rate limit attempts table (giving-platform)
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id serial PRIMARY KEY,
    identifier varchar(255) NOT NULL,
    action text NOT NULL,
    attempt_count integer NOT NULL DEFAULT 1,
    window_started_at timestamptz NOT NULL DEFAULT now(),
    last_attempt_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS rate_limit_attempts_identifier_action_idx ON rate_limit_attempts (identifier, action);
