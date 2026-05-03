-- Tagthr Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  host_token UUID NOT NULL,
  pin_hash TEXT,
  video_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sessions_slug ON sessions(slug);
CREATE INDEX IF NOT EXISTS idx_sessions_host_token ON sessions(host_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- Participants table (tracks all anonymous users)
CREATE TABLE IF NOT EXISTS participants (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Participant sessions history (tracks who joined which sessions)
CREATE TABLE IF NOT EXISTS participant_sessions (
  id BIGSERIAL PRIMARY KEY,
  participant_token UUID NOT NULL,
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('host', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  last_visited_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(participant_token, session_id)
);

-- Indexes for participant_sessions
CREATE INDEX IF NOT EXISTS idx_participant_sessions_token ON participant_sessions(participant_token);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_session_id ON participant_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_participant_sessions_role ON participant_sessions(role);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  participant_token UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for messages
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Function to check if user can create a session (max 3 active)
CREATE OR REPLACE FUNCTION can_create_session(p_token UUID)
RETURNS BOOLEAN AS $$
DECLARE
  active_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO active_count
  FROM sessions s
  JOIN participant_sessions ps ON s.id = ps.session_id
  WHERE ps.participant_token = p_token
    AND ps.role = 'host'
    AND s.expires_at > now();
  RETURN active_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically clean up expired sessions (optional, run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security (RLS)
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Anyone can read active sessions"
  ON sessions FOR SELECT
  USING (expires_at > now());

CREATE POLICY "Authenticated users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Hosts can update their sessions"
  ON sessions FOR UPDATE
  USING (host_token = auth.uid()::uuid);

-- RLS Policies for participant_sessions
CREATE POLICY "Anyone can read participant sessions"
  ON participant_sessions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join sessions"
  ON participant_sessions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own session records"
  ON participant_sessions FOR UPDATE
  USING (participant_token = auth.uid()::uuid);

-- RLS Policies for messages
CREATE POLICY "Anyone can read messages in active sessions"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = messages.session_id
      AND sessions.expires_at > now()
    )
  );

CREATE POLICY "Authenticated users can create messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for reports
CREATE POLICY "Hosts can read reports for their sessions"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN sessions s ON m.session_id = s.id
      WHERE m.id = reports.message_id
      AND s.host_token = auth.uid()::uuid
    )
  );

CREATE POLICY "Authenticated users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Comments for documentation
COMMENT ON TABLE sessions IS 'Stores watch party sessions with 24-hour expiration';
COMMENT ON TABLE participant_sessions IS 'Tracks which users have joined which sessions (for recent parties)';
COMMENT ON TABLE messages IS 'Stores chat messages for sessions';
COMMENT ON TABLE reports IS 'Stores reported messages for moderation';
COMMENT ON FUNCTION can_create_session IS 'Checks if a user can create a new session (max 3 active)';
COMMENT ON FUNCTION cleanup_expired_sessions IS 'Removes sessions older than 7 days';
