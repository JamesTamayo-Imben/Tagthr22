# Data Flow Architecture - Tagthr Watch Party

## 1. CHAT MESSAGE FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                    SENDER (Any Participant)                      │
├─────────────────────────────────────────────────────────────────┤
│  Input: chatMessage = "This movie is great!"                    │
│  Action: Click Send                                              │
│  Function: sendMessage()                                         │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│            SessionPage.tsx - handleSendMessage()                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Validate: chatMessage.trim() && sessionId && participantToken│
│  2. Call: messageOperations.sendMessage(sessionId, token, msg)   │
│  3. Clear: setChatMessage('')                                    │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│         supabaseClient.ts - messageOperations.sendMessage()      │
├─────────────────────────────────────────────────────────────────┤
│  Supabase API Call:                                              │
│  INSERT INTO messages (                                          │
│    session_id: number,                                           │
│    participant_token: string,                                    │
│    body: "This movie is great!",  ← ✅ CORRECT FIELD            │
│    created_at: timestamp                                         │
│  )                                                               │
│  Returns: {id, session_id, participant_token, body, created_at} │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Database - messages table                  │
├─────────────────────────────────────────────────────────────────┤
│ id │ session_id │ participant_token │ body  │ created_at         │
│ 42 │          7 │ 550e8400-e29b... │ This… │ 2026-05-07T14:32  │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│              Supabase Realtime - messages channel                │
├─────────────────────────────────────────────────────────────────┤
│  Channel: `realtime:messages:session_7`                          │
│  Event: INSERT                                                   │
│  Payload: {                                                      │
│    id: 42,                                                       │
│    body: "This movie is great!",  ← ✅ Data received            │
│    participant_token: "550e8400-e29b...",                        │
│    created_at: "2026-05-07T14:32:00Z"                            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│    SessionPage.tsx - useEffect (realtime subscription)           │
├─────────────────────────────────────────────────────────────────┤
│  Event received: subscribeToMessages() callback triggered        │
│  Map incoming message:                                           │
│  {                                                               │
│    id: "42",                                                     │
│    user: "550E",  (token.slice(0,4))                             │
│    message: newMessage.body,  ← ✅ READS FROM BODY FIELD        │
│    timestamp: new Date("2026-05-07T14:32:00Z")                   │
│  }                                                               │
│                                                                  │
│  Action: setChatMessages(prev => [...prev, newChatMsg])          │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│         React Component - Chat Display Area                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Anonymous#550E (14:32)                                     │ │
│  │ This movie is great!                      ← ✅ TEXT SHOWN  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  [Chat input field] [Send button]                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. VIDEO URL & METADATA FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│           HOST - LandingPage Search & Select Media               │
├─────────────────────────────────────────────────────────────────┤
│  1. Search IMDb for "Avatar"                                     │
│  2. Results: [{title, poster, year, rating, imdbId, ...}]       │
│  3. Click on "Avatar The Way of Water"                           │
│  4. Call: handleCreatePartyFromMedia(media)                      │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│      LandingPage.tsx - handleCreatePartyFromMedia()              │
├─────────────────────────────────────────────────────────────────┤
│  1. Generate: slug = "abc123"                                    │
│  2. Get: token = getParticipantToken()                           │
│  3. Create metadata object:                                      │
│     {                                                            │
│       title: "Avatar: The Way of Water",                         │
│       poster: "https://m.media-amazon.com/images/...",           │
│       year: "2022",                                              │
│       rating: "7.2",                                             │
│       imdbId: "tt1630029"                                        │
│     }                                                            │
│  4. Call sessionOperations.createSession(                        │
│       slug: "abc123",                                            │
│       hostToken: token,                                          │
│       videoUrl: media.poster,  ← ✅ PASS POSTER AS VIDEO URL    │
│       pinHash: undefined,                                        │
│       metadata: {...}                                            │
│     )                                                            │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│      supabaseClient.ts - sessionOperations.createSession()       │
├─────────────────────────────────────────────────────────────────┤
│  Supabase API Call:                                              │
│  INSERT INTO sessions (                                          │
│    slug: "abc123",                                               │
│    host_token: "550e8400-e29b...",                               │
│    video_url: "https://m.media-amazon.com/...",  ← ✅ SAVED     │
│    metadata: {...},                                              │
│    expires_at: now() + 24h                                       │
│  )                                                               │
│  Returns: {id: 7, slug, host_token, video_url, metadata, ...}   │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│         Supabase Database - sessions table                       │
├─────────────────────────────────────────────────────────────────┤
│ id │ slug   │ video_url         │ metadata            │ ...      │
│ 7  │abc123  │ https://m.media.. │ {title, poster...} │ ...      │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
        ┌─────────────────────────────────────┐
        │  PARTICIPANT - Joins Session        │
        │  URL: /party/abc123                 │
        └─────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│       SessionPage.tsx - useEffect (Initialize DB)                │
├─────────────────────────────────────────────────────────────────┤
│  1. Get slug from URL: "abc123"                                  │
│  2. Fetch: sessionOperations.getSessionBySlug("abc123")          │
│     Returns: {                                                   │
│       id: 7,                                                     │
│       video_url: "https://m.media-amazon.com/...",  ← ✅ FETCHED│
│       metadata: {title, poster, ...},                            │
│       host_token: "550e8400-e29b..."                             │
│     }                                                            │
│  3. Set state:                                                   │
│     setVideoUrl(sessionData.video_url)  ← ✅ DISPLAYS VIDEO     │
│     setMediaInfo(sessionData.metadata)  ← ✅ DISPLAYS METADATA  │
│  4. Join as participant:                                         │
│     participantOperations.joinSession(sessionId, token)          │
│  5. Subscribe to realtime for updates                            │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│    React Component - Video Player & Media Info Display           │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  [🎬 Video Player Area]                                   │ │
│  │  [Poster Image: https://m.media-amazon.com/...]           │ │
│  │                                                            │ │
│  │  Title: Avatar: The Way of Water                           │ │
│  │  Year: 2022 | Rating: 7.2 ⭐                              │ │
│  │  IMDb: tt1630029                                           │ │
│  │                                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. MEDIA SELECTION IN SESSION FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│      HOST - In SessionPage, Search & Select New Media            │
├─────────────────────────────────────────────────────────────────┤
│  1. Click "Change Media" button                                  │
│  2. Search for "Inception"                                       │
│  3. Click result                                                 │
│  4. Call: handleMediaSelect(media)                               │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│      SessionPage.tsx - handleMediaSelect()                       │
├─────────────────────────────────────────────────────────────────┤
│  1. Update local state:                                          │
│     setMediaInfo({                                               │
│       title: "Inception",                                        │
│       poster: "https://...",                                     │
│       rating: "8.8",                                             │
│       ...                                                        │
│     })                                                           │
│  2. PERSIST TO DATABASE (✅ NEW):                                │
│     if (sessionId && isHost) {                                   │
│       sessionOperations.updateSession(sessionId, {               │
│         metadata: {...},                                         │
│         video_url: media.poster  ← ✅ SAVE NEW VIDEO URL        │
│       })                                                         │
│     }                                                            │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│      Supabase Database - sessions table UPDATED                  │
├─────────────────────────────────────────────────────────────────┤
│ id │ slug   │ video_url             │ metadata            │ ...  │
│ 7  │abc123  │ https://inception...  │ {title:Inception..}│ ...  │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│      PARTICIPANT (if joined, fetches update on next load)        │
├─────────────────────────────────────────────────────────────────┤
│  Sees: New media with Inception poster & details                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. DATABASE FIELD MAPPING SUMMARY

### ✅ CORRECT FIELD NAMES (After Fixes)

| Component | Operation | Field Name | Value Type | Status |
|-----------|-----------|-----------|-----------|--------|
| **Messages** | Send | `body` | text | ✅ Stored correctly |
| **Messages** | Display | `body` | text | ✅ Read correctly |
| **Sessions** | Create | `video_url` | URL string | ✅ Stored correctly |
| **Sessions** | Fetch | `video_url` | URL string | ✅ Read correctly |
| **Sessions** | Display | `metadata` | JSON object | ✅ Read correctly |

---

## 5. REALTIME SUBSCRIPTION CONNECTIONS

```
Supabase Realtime Channels (PostgREST)
│
├─ 📨 messages:session_7
│  └─ Subscribed by: All participants in session 7
│     Listens to: INSERT, UPDATE, DELETE on messages table
│     Callback: newMessage → setChatMessages()
│
├─ 👥 participants:session_7
│  └─ Subscribed by: All participants in session 7
│     Listens to: INSERT, UPDATE, DELETE on participant_sessions table
│     Callback: participants → setParticipants()
│
└─ ▶️ playback:session_7
   └─ Subscribed by: Non-host participants only
      Listens to: Broadcast from host's playback state
      Callback: {playing, currentTime} → videoRef.play/pause/seek()
```

---

## 6. ERROR PREVENTION CHECKLIST

```
❌ BEFORE FIXES
- Chat showing: "42" instead of message text
- Video: Blank/empty when participant joins
- Database: video_url = NULL
- Field mismatch: Trying to read 'content' but table has 'body'

✅ AFTER FIXES
- Chat showing: Full message text correctly
- Video: Displays poster image URL
- Database: video_url = "https://m.media-amazon.com/..."
- Field aligned: Reading 'body' from messages table
- Metadata synced: title, year, rating persisted
```

---

## 7. DEPLOYMENT VERIFICATION

Build Status: ✅ PASSING
```
✓ 1666 modules transformed
✓ dist/index.html 0.51 kB
✓ dist/assets/index-CvAv0LA8.js 477.14 kB
✓ built in 29.14s
```

Ready for: Testing → Staging → Production
