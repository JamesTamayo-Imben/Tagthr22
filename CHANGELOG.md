# Tagthr Changelog

## Latest Update - Major Backend & Feature Overhaul

### 🎯 **Fixed YouTube Link Crash**

**VideoPlayer.tsx** - Completely rewritten with robust error handling:
- ✅ Multiple YouTube URL pattern matching (watch, embed, shorts, youtu.be)
- ✅ Vimeo URL support with proper error handling
- ✅ Error state UI with helpful messages
- ✅ Safe API loading with callbacks
- ✅ Proper cleanup on component unmount
- ✅ Global player controls for real-time sync (`window.__tagthrPlayer`)
- ✅ YouTube player error codes mapped to user-friendly messages
- ✅ Support for `youtube.com/shorts/` URLs

**Error Messages Now Show:**
- "Invalid video ID" for malformed URLs
- "Video not found or private" for inaccessible videos
- "Video embedding disabled by owner" for restricted videos
- "Failed to load YouTube player" for initialization errors

### 📁 **Recent Parties (Archive) Feature**

**New Component:** `RecentParties.tsx`
- Shows last 10 sessions user has created or joined
- Displays session metadata (title, poster, room code)
- Shows role (host 👑 or member)
- Time-based display ("2h ago", "3d ago", etc.)
- Click to rejoin active parties
- Grayed out expired sessions
- Loading skeleton UI

**Database Integration:**
- New `participant_sessions` table tracks session history
- Stores role (host/member) and visit timestamps
- Persists across browser sessions
- Automatic updates on every session visit

### 🚫 **Max 3 Active Parties Per User**

**New Hook:** `useSessionLimit.ts`
- Checks active session count before creation
- Only counts sessions where user is **host**
- No limit on joining sessions
- Real-time validation against Supabase

**UI Enforcement:**
- Shows modal when limit reached
- Clear error message with active count
- Prevents creation until a party expires or is ended
- Applied to all creation flows:
  - Public Party button
  - Private Party button
  - Search result selection

**Database Function:**
```sql
can_create_session(p_token UUID) RETURNS BOOLEAN
```
- Counts active sessions where user is host
- Returns true if count < 3
- Used by RLS policies for security

### 🔌 **Full Supabase Integration**

**New Files:**
- `src/lib/supabaseClient.ts` - Supabase client configuration
- `src/hooks/useAuth.ts` - Anonymous authentication hook
- `src/hooks/useSessionLimit.ts` - Session limit checking
- `supabase-schema.sql` - Complete database schema
- `SUPABASE_SETUP.md` - Step-by-step setup guide
- `.env.example` - Environment variable template
- `src/vite-env.d.ts` - TypeScript environment types

**Authentication:**
- Anonymous sign-in via `supabase.auth.signInAnonymously()`
- User ID stored as participant token in localStorage
- Automatic session persistence
- No registration required

**Database Schema:**

**sessions** table:
- Stores watch party sessions
- 24-hour expiration (auto-cleanup after 7 days)
- Metadata field for movie/TV info (JSONB)
- PIN hash support for private rooms

**participant_sessions** table:
- Tracks session history for Recent Parties
- Stores role (host/member)
- Tracks join time and last visit
- Used for session limit enforcement

**messages** table:
- Stores chat messages
- Linked to sessions
- Ready for persistence

**reports** table:
- Stores reported messages
- Moderation support

**Row Level Security (RLS):**
- All tables have RLS enabled
- Anonymous users can only access active sessions
- Users can only update their own records
- Hosts can moderate their sessions

### 🎨 **UI/UX Improvements**

**App.tsx:**
- Loading screen while authenticating
- Spinner with "Initializing..." message
- Prevents flash of unauthenticated state

**LandingPage.tsx:**
- Recent Parties section added
- Session limit modal with clear messaging
- Async session creation with validation
- Better error handling

**Navigation.tsx:**
- Professional icons throughout (Lucide React)
- No emojis - clean, modern look

### 📦 **New Dependencies**

```json
{
  "@supabase/supabase-js": "^2.105.1",
  "@types/node": "^25.6.0",
  "typescript": "^6.0.3",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3"
}
```

### 🔧 **Configuration Updates**

**tsconfig.json:**
- Added `types: ["node"]` for NodeJS types
- Added `exclude` for pasted_text folder
- Added `ignoreDeprecations: "6.0"` for TS6 compatibility

**vite.config.ts:**
- Already configured with path aliases (`@/`)
- Tailwind and React plugins enabled

### 🐛 **Bug Fixes**

1. **YouTube Crashes** - Fixed with comprehensive error handling
2. **Type Errors** - Added proper TypeScript types and interfaces
3. **Import Meta Env** - Added Vite client types
4. **Video Player Cleanup** - Proper unmount and destroy calls
5. **CORS Issues** - Using official APIs (YouTube IFrame, Vimeo Player)

### 🚀 **Performance Optimizations**

- Debounced search (500ms) for API calls
- Lazy loading of video player APIs
- Efficient database queries with indexes
- RLS policies for security at database level
- Anonymous auth for zero registration friction

### 📝 **Documentation**

- **SUPABASE_SETUP.md** - Complete Supabase setup guide
- **supabase-schema.sql** - Annotated database schema
- **.env.example** - Environment variable template
- **CHANGELOG.md** - This file

### 🔐 **Security Enhancements**

- Row Level Security on all tables
- Anonymous auth prevents identity theft
- Session expiration (24 hours)
- Rate limit enforcement at DB level
- PIN hashing support for private rooms
- Moderation tools (kick, ban, report)

### 📊 **Database Indexes**

Created indexes for:
- `sessions.slug` - Fast room lookups
- `sessions.host_token` - Host queries
- `sessions.expires_at` - Active session filters
- `participant_sessions.participant_token` - User history
- `participant_sessions.session_id` - Session participants
- `messages.session_id` - Chat retrieval

### 🎮 **Real-time Features Ready**

The system is now prepared for:
- Real-time playback sync via Supabase Realtime
- Live chat updates
- Participant presence tracking
- Host promotion events
- Video URL changes broadcast

### 🌐 **Environment Variables Required**

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

Get these from your Supabase project settings.

### ⚠️ **Breaking Changes**

None - all changes are additive. The app will work in "demo mode" without Supabase configured (localStorage fallback).

### 📈 **Next Steps**

To enable full functionality:
1. Set up Supabase project
2. Run `supabase-schema.sql`
3. Enable anonymous auth
4. Add env variables
5. Restart dev server

### 🎯 **Migration Path**

If you're upgrading from a previous version:
1. Install new dependencies: `pnpm install`
2. Follow `SUPABASE_SETUP.md`
3. No data migration needed (fresh start)

---

## Summary

This update transforms Tagthr from a prototype into a production-ready application with:
- ✅ Robust video playback
- ✅ Persistent storage
- ✅ User session tracking
- ✅ Resource limits
- ✅ Real-time ready
- ✅ Secure by default

All features work together seamlessly with proper error handling, TypeScript types, and professional UI/UX.
