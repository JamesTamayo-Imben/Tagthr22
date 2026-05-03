# Tagthr Supabase Setup Guide

This guide will help you set up Supabase as the backend for the Tagthr watch party application.

## Prerequisites

1. Create a free Supabase account at [https://supabase.com](https://supabase.com)
2. Create a new project in Supabase

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Click on "Project Settings" (gear icon in the sidebar)
3. Go to "API" section
4. Copy your:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Step 2: Configure Environment Variables

1. Create a `.env` file in the project root (copy from `.env.example`)
2. Add your credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Run the Database Schema

1. In your Supabase dashboard, go to the **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL Editor
5. Click **"Run"** to execute

This will create:
- ✅ `sessions` table - stores watch party sessions
- ✅ `participants` table - tracks anonymous users
- ✅ `participant_sessions` table - tracks session history (for Recent Parties)
- ✅ `messages` table - stores chat messages
- ✅ `reports` table - stores reported messages
- ✅ Row Level Security (RLS) policies
- ✅ Helper functions for session limits

## Step 4: Enable Anonymous Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **"Anonymous Sign-ins"**
3. **Enable** it
4. Save changes

## Step 5: Test the Setup

1. Start your development server: `pnpm run dev` (or use Figma Make preview)
2. The app will automatically:
   - Sign users in anonymously
   - Store their participant token in localStorage
   - Use this token for all database operations

## Features Enabled by Supabase

### 1. **Recent Parties** 📁
- Users can see their last 10 watch parties
- Shows both hosted and joined sessions
- Displays time since last visit
- Click to rejoin active parties

### 2. **Session Limits** 🚫
- Each user can host max **3 active parties** at once
- Joining parties has no limit
- Prevents party spam and resource abuse
- Shows clear error when limit is reached

### 3. **Real-time Sync** ⚡
- Video playback synchronization
- Live chat updates
- Participant presence tracking
- All powered by Supabase Realtime

### 4. **Persistent Storage** 💾
- Sessions persist across browser refreshes
- Chat history is saved
- Participant tracking across visits
- 24-hour session expiration (auto-cleanup after 7 days)

## Database Schema Overview

```sql
sessions
├─ id (BIGSERIAL)
├─ slug (TEXT, unique)
├─ host_token (UUID)
├─ pin_hash (TEXT, optional)
├─ video_url (TEXT)
├─ metadata (JSONB) - stores movie/TV info
├─ expires_at (TIMESTAMPTZ) - 24h from creation
└─ created_at (TIMESTAMPTZ)

participant_sessions
├─ id (BIGSERIAL)
├─ participant_token (UUID)
├─ session_id (BIGINT → sessions.id)
├─ role (TEXT) - 'host' or 'member'
├─ joined_at (TIMESTAMPTZ)
└─ last_visited_at (TIMESTAMPTZ)

messages
├─ id (BIGSERIAL)
├─ session_id (BIGINT → sessions.id)
├─ participant_token (UUID)
├─ body (TEXT)
└─ created_at (TIMESTAMPTZ)

reports
├─ id (BIGSERIAL)
├─ message_id (BIGINT → messages.id)
├─ reported_by (UUID)
├─ reason (TEXT)
└─ created_at (TIMESTAMPTZ)
```

## Security

- **Row Level Security (RLS)** is enabled on all tables
- Anonymous users can only access active (non-expired) sessions
- Users can only update their own participant records
- Hosts can moderate their own sessions
- All queries are filtered by RLS policies

## Troubleshooting

### "Invalid API key" error
- Check that your `.env` file has the correct `VITE_SUPABASE_ANON_KEY`
- Make sure the file is named exactly `.env` (not `.env.txt`)
- Restart your dev server after changing `.env`

### "Cannot read sessions" error
- Verify the database schema was created successfully
- Check RLS policies are enabled
- Ensure anonymous auth is enabled in Supabase

### Recent Parties not showing
- Check that `participant_sessions` table exists
- Verify you've created at least one party
- Check browser console for errors

### Session limit not working
- Verify the `can_create_session()` function exists
- Check that `participant_sessions` records are being created
- Look for errors in browser console

## Optional: Enable Real-time

1. In Supabase dashboard, go to **Database** → **Replication**
2. Find the tables: `sessions`, `messages`, `participant_sessions`
3. Enable **"Realtime"** for each table
4. This allows instant updates across all connected clients

## Next Steps

- Implement chat persistence (save/load messages from `messages` table)
- Add real-time playback sync using Supabase Realtime broadcasts
- Implement the report system with `reports` table
- Add participant presence tracking with heartbeat updates

## Support

For issues with Supabase:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)

For Tagthr-specific issues:
- Check the main README.md
- Review component code in `/src/app/components/`
