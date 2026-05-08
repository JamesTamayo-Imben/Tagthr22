# Host-Only Playback Control - Testing Guide

## Quick Start Testing

### Setup
1. Build and deploy the application:
   ```bash
   npm run build
   npm run preview  # Or deploy to production
   ```

2. Open the application in two browser windows/tabs

3. Create a new session with a YouTube or Vimeo URL as the **Host**

4. Copy the invite link and open in another browser as a **Participant**

---

## Test Scenarios

### Scenario 1: Basic Host Controls
**What to test**: Host can see all video controls

**Steps:**
1. As Host, load a YouTube video
2. **Verify**: You see a progress bar, play/pause button, fullscreen button
3. **Verify**: You can click any timestamp on the progress bar
4. **Verify**: You can use keyboard arrows to skip forward/backward

**Expected Result:** ✅ All controls visible and functional

---

### Scenario 2: Participant View (No Controls)
**What to test**: Participants only see the video player, no controls

**Steps:**
1. As Participant, join the same session
2. **Verify**: Video player appears fullscreen without any UI controls
3. **Verify**: No progress bar visible
4. **Verify**: No play/pause buttons
5. **Verify**: Keyboard shortcuts (arrows, space) do NOT work
6. **Note**: Fullscreen button may appear from browser (normal)

**Expected Result:** ✅ Only video visible, no playback controls

---

### Scenario 3: Host Seeks, Participant Syncs
**What to test**: Real-time seek synchronization

**Steps:**
1. Start video as Host at 0:00
2. Play video for 10 seconds (now at ~0:10)
3. As Host, click progress bar to seek to 2:00 (2 minutes)
4. **Check console** (F12 → Console tab):
   - Host should show: `✅ Broadcasted seek position: 120`
   - Participant should show: `✅ Participant synced to: 120`
5. **Verify**: Participant player instantly jumps to 2:00
6. Participant's local time should match Host's time

**Expected Result:** ✅ Within 1-2 seconds, participant syncs to 2:00

---

### Scenario 4: Host Pauses, Participant Pauses
**What to test**: Play/pause state synchronization

**Steps:**
1. As Host, pause the video at any time
2. **Check console**: Should see `✅ Broadcasted...playing: false`
3. **Verify**: Participant video also pauses instantly
4. As Host, press play again
5. **Verify**: Participant video resumes playing

**Expected Result:** ✅ Participant pause/play matches Host within 500ms

---

### Scenario 5: Rapid Seeking (Debounce Test)
**What to test**: System handles rapid seek events without flooding network

**Steps:**
1. As Host, quickly drag the progress bar left and right 5-6 times rapidly
2. **Check console**: Count broadcasts
3. **Expected**: Should see ~5-6 broadcasts over 2-3 seconds, not dozens
4. **Verify**: No errors in console, participant smoothly follows

**Why**: Debounce limits broadcasts to max ~3 per second

**Expected Result:** ✅ Smooth performance, controlled broadcast rate

---

### Scenario 6: Host Seeks to Future Position
**What to test**: Participant can jump ahead without waiting for playback

**Steps:**
1. Video currently at 0:30
2. As Host, seek directly to 9:00 (far ahead in video)
3. **Verify**: Participant instantly jumps to 9:00
4. No gradual buffering, direct jump

**Expected Result:** ✅ Participant at 9:00 within 1 second

---

### Scenario 7: Multiple Participants Sync
**What to test**: All participants stay in sync with single host

**Steps:**
1. Open 3 browser windows total: 1 Host + 2 Participants
2. All join same session
3. Host seeks to 3:00
4. **Verify**: Both Participant 1 and Participant 2 show 3:00 simultaneously
5. Host seeks to 5:00
6. **Verify**: Both participants at 5:00

**Expected Result:** ✅ All participants perfectly synchronized

---

### Scenario 8: Participant Joins Mid-Play
**What to test**: Late-joining participants instantly sync to current position

**Steps:**
1. Host starts video and lets it play for 30 seconds (now at ~0:30)
2. New participant joins the session
3. **Verify**: New participant instantly appears at 0:30 (or near current time)
4. No need for manual synchronization

**Expected Result:** ✅ New participant auto-syncs without manual action

---

## Manual API Testing (Advanced)

### Check Broadcasts via Console
```javascript
// Host side - see what's being broadcast
// Open DevTools Console (F12) and look for these logs:
"✅ Broadcasted seek position: X"
"✅ Broadcasted playback change..."
```

### Monitor Sync Gaps
```javascript
// Participant side - see if there's drift
// Console shows:
"✅ Participant synced to: 120"  // Means it was out of sync and just synced

// If you see many of these, drift is occurring
```

### Network Inspection
```
1. Open DevTools (F12)
2. Go to Network tab
3. Look for WebSocket connections (pink icon)
4. Click on the realtime connection
5. Messages tab shows actual broadcasts sent
```

---

## Troubleshooting

### Issue: Participant doesn't sync when host seeks
**Cause**: Broadcast might be failing

**Fix**:
1. Check console for errors
2. Verify session ID is correct
3. Check Supabase realtime is enabled
4. Reload participant page and try again

### Issue: Controls visible for participant
**Cause**: `isHost` prop not passed correctly

**Fix**:
1. Check SessionPage passes `isHost={isHost}` to VideoPlayer
2. Verify isHost boolean is correctly determined
3. For YouTube, check playerVars includes `controls: isHost ? 1 : 0`

### Issue: Participant syncs too frequently (jittery)
**Cause**: Threshold might be too low

**Fix**:
1. Increase threshold in SessionPage from 0.5s to 1.0s:
   ```typescript
   if (Math.abs(currentTimeRef.current - playbackState.currentTime) > 1.0) {
   ```
2. Rebuild and test

### Issue: Host seeks but participant doesn't move
**Cause**: Channel message not received

**Fix**:
1. Check browser console for WebSocket errors
2. Verify Supabase credentials are correct
3. Try seeking again
4. Reload both windows if problem persists

---

## Performance Checklist

- [ ] No lag when seeking (< 1 second)
- [ ] No console errors
- [ ] Smooth playback without stuttering
- [ ] Build size reasonable (< 500 kB)
- [ ] No memory leaks (DevTools → Memory tab)

---

## Pass/Fail Criteria

### PASS ✅
- Host has full playback control
- Participant can't pause or seek
- Participant autosync works within 1 second
- Multiple participants stay synchronized
- No console errors
- Debounce prevents broadcast flooding

### FAIL ❌
- Participant can see controls
- Seeking doesn't synchronize
- Frequent console errors
- Build fails or has TypeScript errors
- Memory usage continuously increases

---

## Example Console Output

### Healthy Session
```
Host Console:
✅ Broadcasted seek position: 0
✅ Broadcasted seek position: 15
✅ Broadcasted seek position: 90
✅ Broadcasted seek position: 180

Participant Console:
✅ Participant synced to: 0
✅ Participant synced to: 15
✅ Participant synced to: 90
✅ Participant synced to: 180
```

### Issue Session
```
Participant Console:
(no "synced to" messages appearing)
ERROR: Failed broadcasting seek
...
(socket connection warnings)
```

---

## Questions?

If you encounter issues:
1. Check console logs (F12)
2. Verify both are in same session
3. Check network tab for WebSocket health
4. Try reload + rejoin
5. Check Supabase status page
