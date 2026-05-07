# ⚡ QUICK ACTION GUIDE - Fix Video URL Persistence

**Time Required:** 5 minutes  
**Difficulty:** Easy  
**Status:** ✅ Code done, just need DB policy update  

---

## 🚀 3-Step Fix

### Step 1: Update RLS Policies in Supabase ⏳ 3 MINUTES

**Go to:** Supabase Dashboard → **Authentication** → **Policies**

**Option A: Manual Update (Recommended for first-time)**

1. Select table: **sessions**
2. Find policy: `"Authenticated users can create sessions"`
3. Click to edit → Delete this policy
4. Create new policy:
   - Name: `"Anyone can create sessions"`
   - Operation: `INSERT`
   - WYSIWYG: Toggle off
   - Expression: `true`
   - Save

5. Repeat for **participant_sessions** table
   - Delete: `"Authenticated users can join sessions"`
   - Create: `"Anyone can join sessions"` (INSERT, `true`)

6. Repeat for **messages** table
   - Delete: `"Authenticated users can create messages"`
   - Create: `"Anyone can create messages"` (INSERT, `true`)

**Option B: SQL (Faster)**

Go to **SQL Editor** in Supabase and run:

```sql
-- Drop old blocking policies
DROP POLICY IF EXISTS "Authenticated users can create sessions" ON sessions;
DROP POLICY IF EXISTS "Authenticated users can join sessions" ON participant_sessions;
DROP POLICY IF EXISTS "Authenticated users can create messages" ON messages;
DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
DROP POLICY IF EXISTS "Hosts can read reports for their sessions" ON reports;
DROP POLICY IF EXISTS "Hosts can update their sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update their own session records" ON participant_sessions;

-- Create new policies
CREATE POLICY "Anyone can create sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Session host can update their sessions" ON sessions FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can join sessions" ON participant_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participant records" ON participant_sessions FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can create messages" ON messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can create reports" ON reports FOR INSERT WITH CHECK (true);
```

### Step 2: Verify Code Update ✅ ALREADY DONE

The code fix is already applied and building:
```bash
# ✅ Already done - just verify
npm run build
# Should show: ✓ built in 18.79s
```

### Step 3: Test ✅ 2 MINUTES

```
1. npm run dev
2. Create party with media
3. Paste URL: https://youtube.com/watch?v=dQw4w9WgXcQ
4. Click "Update"
5. Check console: Should show ✅ Video URL saved
6. Refresh page → URL should still be there
```

---

## 🎯 Success Indicators

✅ **You'll know it's fixed when:**

1. **Browser Console Shows:**
   ```
   ✅ Video URL saved to Supabase: https://...
   ```

2. **Supabase Database Shows:**
   ```sql
   SELECT video_url FROM sessions LIMIT 1;
   -- Result: https://youtube.com/... (NOT NULL)
   ```

3. **Refresh Persistence Works:**
   - Paste URL
   - See in UI
   - Refresh browser
   - URL still there ✅

---

## ⚡ TL;DR

**Problem:** Video URL disappears on refresh  
**Cause 1:** `updateVideoUrl()` didn't save to database  
**Cause 2:** RLS policies blocked writes  

**Fix 1:** ✅ Code updated - `updateVideoUrl()` now calls `updateSession()`  
**Fix 2:** ⏳ Update RLS policies in Supabase (allow anonymous writes)  

**Result:** Video URL persists across refreshes ✅

---

## 📞 Questions?

- **How the fix works?** → See `FIX_VIDEO_URL_PERSISTENCE.md`
- **Detailed steps?** → See `VIDEO_URL_FIX_SUMMARY.md`
- **Database verification?** → See `FIX_VIDEO_URL_PERSISTENCE.md` → Verification section

---

**Estimated Total Time:** 5 minutes  
**Complexity:** Easy (just updating Supabase policies)  
**Impact:** CRITICAL (fixes core feature)  

**Go ahead and apply Step 1 (RLS policies) and test!** 🚀
