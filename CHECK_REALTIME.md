# Check Realtime Configuration

If status changes aren't appearing in real-time, check these:

## 1. Verify Realtime is Enabled in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Replication**
3. Find the `profiles` table
4. Make sure it's **enabled** (toggle should be ON)

If it's not enabled:
- Toggle it ON
- Or run this SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

## 2. Check Browser Console

Open browser console (F12) and look for:
- ✅ `Realtime subscription active - listening for changes`
- ✅ `Realtime update received:` (when someone changes status)
- ❌ Any errors about realtime or websocket

## 3. Test Realtime Connection

1. Open dashboard in two browser windows
2. Change status in one window
3. Check console in both windows
4. Status should update in both windows immediately

## 4. Common Issues

### Issue: "Realtime subscription timed out"
- **Fix:** Check internet connection
- **Fix:** Verify Supabase URL and key are correct

### Issue: "CHANNEL_ERROR"
- **Fix:** Check if Realtime is enabled in Supabase dashboard
- **Fix:** Verify RLS policies allow reading profiles

### Issue: Updates not appearing
- **Fix:** Make sure `ALTER PUBLICATION supabase_realtime ADD TABLE profiles;` was run
- **Fix:** Check browser console for errors
- **Fix:** Try refreshing the page

## 5. Verify SQL Setup

Run this to check if realtime is enabled:

```sql
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

You should see `profiles` in the results.

If not, run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
```

## 6. Test Query

Manually update a profile and see if realtime triggers:

```sql
UPDATE profiles 
SET status = 'busy', updated_at = NOW() 
WHERE id = 'some-user-id';
```

If realtime is working, all connected clients should see the update immediately.
