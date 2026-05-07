# Testing Guide - Video URL & Chat Fixes

## Quick Verification (5 minutes)

### Test 1: Chat Message Display ✅

**Scenario:** Send a chat message and verify it displays as text, not a number

**Steps:**
1. Open `http://localhost:5173`
2. Create a public party with any media
3. You should be joined as host
4. Scroll down to chat area
5. Type: "Testing chat message"
6. Click Send
7. **Expected:** Message appears as "Testing chat message"
8. **NOT Expected:** Message shows as ID number like "42"

**Where to check:**
- Browser console: Should show message in state
- Network tab: POST to `/rest/v1/messages` should return `body: "Testing chat message"`

---

### Test 2: Video URL Storage (Single User) ✅

**Scenario:** Create party with media and verify poster loads

**Steps:**
1. Open `http://localhost:5173`
2. Search for "Avatar"
3. Click on "Avatar: The Way of Water"
4. Click "Create Party"
5. **Expected:** Redirected to session with poster image visible
6. **Expected:** In browser console: `videoUrl = "https://m.media-amazon.com/images/..."`

**Debug:**
```javascript
// In browser console
console.log(document.querySelector('[data-media-info]'))
// Should show media info with poster URL
```

---

### Test 3: Video URL Persistence (Multi-User) ⚠️

**Scenario:** Create party as host, join as participant, verify both see video

**Steps:**
1. **User A (Host):**
   - Open private window: `http://localhost:5173`
   - Search for "Inception"
   - Create party
   - Copy the party link: `/party/xyz123`
   - **Verify:** Poster visible for host

2. **User B (Participant):**
   - Open second private window
   - Paste link: `http://localhost:5173/party/xyz123`
   - **Expected:** Same poster visible
   - **NOT Expected:** Blank/empty video area

**Debug:**
```javascript
// In both browsers, check DB fetch
console.log('Session data:', {
  video_url: 'should have poster URL',
  metadata: 'should have title, poster, year, rating'
})
```

---

### Test 4: Chat Realtime Sync (Multi-User)

**Scenario:** Send chat between two participants

**Steps:**
1. **User A (Host) & User B (Participant):** Both in same session

2. **User A sends:** "Hello from host"
   - **Check User A:** Message appears immediately
   - **Check User B:** Message appears without page reload
   - **Check message text:** Full text visible, not just ID

3. **User B sends:** "Hello from participant"
   - **Check User B:** Message appears immediately
   - **Check User A:** Message appears in realtime
   - **Check message text:** Full text visible

**Network verification:**
```
POST /rest/v1/messages
{
  "session_id": 7,
  "participant_token": "550e8400-e29b-41d4-a716-446655440000",
  "body": "Hello from host",  ← ✅ Should use 'body' field
  "created_at": "2026-05-07T14:32:00Z"
}
```

---

## Deep Verification (15 minutes)

### Test 5: Database Verification ✅

**Access Supabase SQL Editor:**

1. **Check messages table:**
   ```sql
   SELECT id, session_id, participant_token, body, created_at
   FROM messages
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   **Verify:** `body` column has full message text (not NULL)

2. **Check sessions table:**
   ```sql
   SELECT id, slug, host_token, video_url, metadata, created_at
   FROM sessions
   ORDER BY created_at DESC
   LIMIT 3;
   ```
   **Verify:** `video_url` has poster URL (not NULL)
   **Verify:** `metadata` has JSON with {title, poster, year, rating, imdbId}

3. **Check participant_sessions:**
   ```sql
   SELECT id, participant_token, session_id, role, joined_at
   FROM participant_sessions
   ORDER BY joined_at DESC
   LIMIT 5;
   ```
   **Verify:** Participants correctly linked to sessions

---

### Test 6: Realtime Connection Verification ✅

**Browser Console:**

```javascript
// Check if Supabase client is initialized
console.log('Supabase client ready:', supabase !== undefined)

// Monitor realtime subscriptions
// Add this to SessionPage.tsx temporarily for debugging
useEffect(() => {
  console.log('Realtime channels subscribed:', {
    messages: messagesSubscriptionRef.current ? 'ACTIVE' : 'INACTIVE',
    participants: participantsSubscriptionRef.current ? 'ACTIVE' : 'INACTIVE',
    playback: playbackSubscriptionRef.current ? 'ACTIVE' : 'INACTIVE'
  })
}, [])
```

**Expected Console Output:**
```
Supabase client ready: true
Realtime channels subscribed: {
  messages: "ACTIVE",
  participants: "ACTIVE",
  playback: "ACTIVE"
}
```

---

### Test 7: Media Selection Update (In Session) ✅

**Scenario:** Host changes media mid-session

**Steps:**
1. Host in session with one media (e.g., Avatar)
2. Participant joins and sees Avatar poster
3. Host clicks "Change Media"
4. Host searches and selects different media (e.g., Inception)
5. **Host verifies:** Poster changed to Inception
6. **Participant reload:** Should see Inception poster
   (Note: Current implementation fetches on page load, not realtime)

**Database check after step 4:**
```sql
SELECT video_url, metadata 
FROM sessions 
WHERE slug = 'xyz123'
LIMIT 1;
```
**Expected:** video_url and metadata updated with new media

---

## Common Issues & Fixes

### Issue: Chat showing numbers

**Diagnosis:**
```javascript
// In SessionPage, check mapping
console.log('Message object:', {
  id: msg.id,
  user: msg.participant_token,
  message: msg.body,  // ✅ Should have full text
  timestamp: msg.created_at
})
```

**Solution:** Verify SessionPage line 140 and 167 use `msg.body` not `msg.content`

---

### Issue: Video URL blank/empty

**Diagnosis:**
```javascript
// In SessionPage initialization
console.log('Session data:', {
  videoUrl: videoUrl || 'EMPTY',  // Should have URL
  mediaInfo: mediaInfo || 'EMPTY',
  sessionData: sessionData || 'NOT LOADED'
})
```

**Solution:** Verify:
1. LandingPage passes `media.poster` to `createSession()`
2. SessionPage sets `setVideoUrl(sessionData.video_url)` after fetch
3. Database has `video_url` populated (check SQL above)

---

### Issue: Chat not syncing between users

**Diagnosis:**
```javascript
// Check if message was persisted
console.log('After sendMessage, check if in DB:')
// Wait 2 seconds, then query
fetch('/rest/v1/messages?session_id=eq.7&order=created_at.desc&limit=1')
  .then(r => r.json())
  .then(data => console.log('Latest message:', data[0]))
```

**Solution:**
1. Verify `messageOperations.sendMessage()` completes without error
2. Check browser Network tab for failed POST requests
3. Verify Supabase URL and API key in `.env` are correct
4. Check realtime subscription is active (see Test 6)

---

## Performance Baseline

Expected timing after fixes:

| Operation | Time | Target |
|-----------|------|--------|
| Send message | <100ms | User sees input clear immediately |
| Message appears for others | <500ms | Near-realtime via subscription |
| Select new media | <200ms | Local state updates instantly |
| Participant loads video | <1s | Fetches session data and displays |
| Chat load from DB | <300ms | Initial load of old messages |
| Realtime subscription connect | <2s | On page load, background |

---

## Debugging Commands

**Full test flow in browser console:**

```javascript
// 1. Check participant token
console.log('Token:', localStorage.getItem('tagthr_participant_token'))

// 2. Check current session
console.log('Current session ID:', sessionId)

// 3. Check chat state
console.log('Chat messages:', chatMessages.map(m => ({
  user: m.user,
  message: m.message,
  timestamp: m.timestamp
})))

// 4. Check media state
console.log('Media info:', mediaInfo)
console.log('Video URL:', videoUrl)

// 5. Check participants
console.log('Participants:', participants.map(p => ({
  name: p.name,
  isHost: p.isHost,
  isOnline: p.isOnline
})))

// 6. Manual message send test
// await messageOperations.sendMessage(7, 'token-here', 'Test message')
```

---

## Success Criteria ✅

All these should be TRUE after fixes:

- [x] Chat messages display as text, not numbers
- [x] Video URL saved when party created
- [x] Video URL persisted when media selected in session
- [x] Participants see video when joining
- [x] Messages sync in realtime between users
- [x] Database has correct field names (body, video_url)
- [x] Build passes without errors
- [x] No TypeScript errors
- [x] No console errors on page load
- [x] Supabase realtime subscriptions active

---

## Next Steps

If all tests pass:
1. ✅ Commit changes to git
2. ✅ Deploy to staging environment
3. ✅ Run full user acceptance testing
4. ✅ Deploy to production

If any test fails:
1. Check specific error in browser console
2. Refer to "Common Issues & Fixes" section
3. Verify database state (see SQL queries above)
4. Check network requests in DevTools
5. Report with full error message and steps to reproduce
