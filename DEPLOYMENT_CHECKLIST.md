# Timezone Fix - Deployment Checklist ✅

## Pre-Deployment

- [ ] **Backup:** Take a screenshot of any important trip data (or write it down)
- [ ] **Review:** Read FIX_SUMMARY.md to understand what changed
- [ ] **Files ready:** Verify you have:
  - ✓ server.js (new)
  - ✓ index.html (new)
  - ✓ TIMEZONE_FIX_GUIDE.md
  - ✓ FIX_SUMMARY.md

---

## Deployment

### Phase 1: Push Code to GitHub

- [ ] Navigate to trip-organizer-app directory
  ```bash
  cd /path/to/trip-organizer-app
  ```

- [ ] Replace server.js
  ```bash
  cp /path/to/new/server.js ./server.js
  ```

- [ ] Replace index.html
  ```bash
  cp /path/to/new/index.html ./public/index.html
  ```

- [ ] Commit server.js
  ```bash
  git add server.js
  git commit -m "Fix: Migrate meal_date from DATE to TEXT for timezone fix"
  ```

- [ ] Commit index.html
  ```bash
  git add public/index.html
  git commit -m "Fix: Use local timezone dates instead of UTC in calendar"
  ```

- [ ] Push to GitHub
  ```bash
  git push origin main
  ```

- [ ] **Verify Vercel deployment started**
  - Go to vercel.com → trip-organizer project
  - Watch the deployment build
  - Wait for "✓ Production deployment ready"

### Phase 2: Clean Database

⚠️ **Critical:** Delete all existing trips so the migration applies cleanly

#### Option A: Vercel Console (Easiest)

1. Go to vercel.com → trip-organizer project
2. Click "Storage" tab
3. Click "Browse" → Select Postgres database
4. In the SQL editor, run:
   ```sql
   DELETE FROM trip_meals;
   DELETE FROM trip_items;
   DELETE FROM trip_other_stuff;
   DELETE FROM trip_metadata;
   DELETE FROM trips;
   ```
5. Click "Execute"
6. Should see "5 statements executed"

#### Option B: App UI (If Vercel console unavailable)

1. Visit your app: https://trip-organizer-five.vercel.app
2. Go to "Admin" tab
3. For each trip listed:
   - Click the trip
   - Click "Delete Trip"
   - Confirm

### Phase 3: Test the Fix

1. **Clear browser cache**
   - Windows: Ctrl + Shift + Delete
   - Mac: Cmd + Shift + Delete
   - Select "All time" → Clear

2. **Refresh app**
   - Go to https://trip-organizer-five.vercel.app
   - Should see "No trips yet"

3. **Create test trip**
   - Click "Go to Admin to create new trip"
   - Name: "test-fix"
   - Start Date: **Today** (or Aug 26, 2026)
   - Duration: 3 days
   - Families: Select 1-2 families
   - Click "Create Trip"

4. **Verify dates in Admin tab**
   - Check the trip card
   - Verify start date matches what you selected
   - ✓ Should match exactly (no -1 day offset)

5. **Add a test meal**
   - Go to "Meals" tab
   - Click "+ Add Meal" on today's date
   - Family: Select one
   - Time: Breakfast
   - Meal Name: "Test Meal"
   - Headcount: 8
   - Click "Save"

6. **Verify dates match everywhere**
   - ✓ Modal showed today's date when you saved
   - ✓ Meal appears on today's date in calendar
   - ✓ Meal appears on today's date in mobile list
   - ✓ Admin card shows today as start date

7. **Add another meal on a different day**
   - Click "+ Add Meal" on tomorrow
   - Family: Different one
   - Time: Lunch
   - Meal Name: "Lunch Test"
   - Click "Save"

8. **Verify second meal**
   - ✓ Appears on tomorrow's date (not today, not yesterday)
   - ✓ Modal showed correct date when you saved

**If all checks pass → ✅ Fix is working!**

---

## Post-Deployment

- [ ] **Share the good news** with your group
  - The date bug is fixed!
  - Dates now display correctly in calendar, modals, and admin

- [ ] **(Optional) Reload historical trips**
  - Once verified the fix works, you can restore historical data:
  ```bash
  POSTGRES_URL_NON_POOLING="<your-db-url>" node seed-historical-trips.js
  ```
  - Get `POSTGRES_URL_NON_POOLING` from:
    - Vercel → Storage → Postgres → Connect → Node.js (copy the URL)

---

## Troubleshooting

### Issue: Dates still off by 1 day
**Solution:**
1. Clear browser cache completely (Ctrl/Cmd + Shift + Delete)
2. Close all tabs with the app
3. Reopen and refresh
4. Create a new test trip from scratch

### Issue: "DELETE failed" in database
**Solution:**
1. Make sure you're in the SQL editor in Vercel Storage
2. Try deleting one table at a time:
   ```sql
   DELETE FROM trip_meals;
   -- Wait for success
   DELETE FROM trip_items;
   -- etc.
   ```

### Issue: Deployment shows error
**Solution:**
1. Check GitHub push was successful: `git log --oneline` (should show your commits)
2. Go to Vercel → Deployments tab
3. Click the failed deployment
4. Scroll down to see error messages
5. Common fixes:
   - Missing dependencies: Run `npm install` locally, commit package-lock.json
   - Syntax error in server.js or index.html: Compare with the backup

### Issue: Meals still not showing in calendar
**Solution:**
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for `/api/trips/test-fix/meals` request
4. Click it, look at Response
5. Should show array with your meals: `[{meal_date: "2026-08-26", ...}]`
6. If response is empty, the meal wasn't saved
7. Try creating a meal again, check the POST request body

---

## Rollback (If Something Goes Wrong)

If the fix breaks something:

1. **Revert GitHub**
   ```bash
   git revert HEAD~1  # Undo the most recent commit
   git push origin main
   ```

2. **Wait for Vercel redeploy**

3. **Restore database from backup**
   - If you have backups, restore them
   - If not, you'll need to re-add trips manually

**Note:** The database changes are one-way. If you need to rollback to the old DATE schema, you'd need to recreate the table. Better to fix forward than go backward!

---

## Success Indicators ✅

You'll know the fix worked when:

✓ Calendar shows correct dates (matches what the user selected)
✓ Meal modals show correct dates (no -1 day offset)
✓ Admin trip card shows correct start date
✓ Meals appear on the correct days in the calendar
✓ All dates consistent across mobile list and desktop grid
✓ New trips created with correct dates automatically

---

## Done! 🎉

Once you've verified everything works, you're ready to use the app with your group.

All dates will now display correctly, no more timezone confusion!
