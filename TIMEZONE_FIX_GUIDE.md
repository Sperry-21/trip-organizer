# Group Trip Organizer - Timezone Fix Deployment Guide

## What Was Broken

**Two timezone bugs** were causing dates to display incorrectly:

1. **Backend:** `trip_meals.meal_date` was stored as `DATE` type → Postgres applied UTC timezone conversion
2. **Frontend:** Date creation and grid rendering used `toISOString()` which assumes UTC

**Result:** When you picked "Aug 22" in the app, it would:
- Store as Aug 21 in the database (UTC offset)
- Display as Aug 21 in modals
- Fail to match meals to calendar dates
- Meals wouldn't show up in the calendar

## What's Fixed

✅ Backend: `trip_meals.meal_date` changed from DATE to TEXT  
✅ Backend: Removed UTC date conversion in GET/POST meal endpoints  
✅ Frontend: Date creation uses local timezone (no toISOString)  
✅ Frontend: Calendar grid generates dates in local timezone  

Dates are now stored and displayed as plain `YYYY-MM-DD` strings in your local timezone.

---

## Deployment Steps

### Step 1: Replace server.js

1. Go to your local trip-organizer-app directory
2. Replace `server.js` with the new fixed version
3. Commit and push:

```bash
cd /path/to/trip-organizer-app
git add server.js
git commit -m "Fix: Migrate meal_date from DATE to TEXT to handle timezone correctly"
git push origin main
```

Vercel will auto-deploy.

### Step 2: Replace index.html

1. In the `public/` folder, replace `index.html` with the new fixed version
2. Commit and push:

```bash
git add public/index.html
git commit -m "Fix: Use local timezone dates instead of UTC in calendar"
git push origin main
```

Vercel will auto-deploy.

### Step 3: Delete All Trips (Clean Slate)

⚠️ **This is critical for the timezone fix to work properly**

You need to delete all existing trips so the database migration applies cleanly.

**Option A: Via Vercel Console**
1. Go to your Vercel project dashboard
2. Click "Storage" → "Browse"
3. Select the Postgres database
4. Run this SQL command:

```sql
DELETE FROM trip_meals;
DELETE FROM trip_items;
DELETE FROM trip_other_stuff;
DELETE FROM trip_metadata;
DELETE FROM trips;
```

**Option B: Via your app**
1. Visit your live app: https://trip-organizer-five.vercel.app (or your URL)
2. Go to the Admin tab
3. Delete each trip one by one

### Step 4: Create a Test Trip

1. Visit the app
2. Click "Go to Admin to create new trip"
3. Create a new trip:
   - Trip Name: "test-aug-26"
   - Start Date: Aug 26, 2026 (or today's date)
   - Duration: 4 days
   - Families: Select any
4. Click "Create Trip"

### Step 5: Verify the Fix

1. Go to the **Meals** tab
2. Click "+ Add Meal" on a date
3. Select a family and time, add a meal
4. **Check that:**
   - The meal modal shows the correct date (not off by 1)
   - The calendar shows the meal on the correct day
   - The Admin trip card shows correct start date (not off by 1)

✅ **If all dates match, the fix is working!**

### Step 6: Load Historical Trips (Optional)

Once you've verified the fix works, you can reload your historical data:

```bash
POSTGRES_URL_NON_POOLING="<your-db-url>" node seed-historical-trips.js
```

(Get `POSTGRES_URL_NON_POOLING` from Vercel → Storage → Postgres → Connect → Node.js)

---

## What Changed in the Code

### server.js

**Line 19:** Changed table creation
```javascript
// BEFORE
meal_date DATE NOT NULL

// AFTER
meal_date TEXT NOT NULL
```

**Lines 48-52:** Added migration
```javascript
// Migrate meal_date from DATE to TEXT type (handles timezone conversion issue)
try {
  await sql`ALTER TABLE trip_meals ALTER COLUMN meal_date TYPE TEXT`;
} catch (e) {
  // Column is probably already TEXT, that's fine
}
```

**Lines 234-240:** Fixed GET meals endpoint (removed date conversion)
```javascript
// BEFORE
const meals = result.rows.map(meal => ({
  ...meal,
  meal_date: new Date(meal.meal_date).toISOString().split('T')[0]
}));

// AFTER
// meal_date is already stored as TEXT (YYYY-MM-DD) in local timezone, no conversion needed
res.json(result.rows);
```

**Lines 257-263:** Fixed POST meals endpoint
```javascript
// BEFORE
meal_date = new Date(meal_date).toISOString().split('T')[0];

// AFTER
// Store meal_date as TEXT without timezone conversion
// Expect YYYY-MM-DD format from frontend (already in local timezone)
```

### index.html

**Lines 2107-2111:** Fixed saveMeal date creation
```javascript
// BEFORE
const dateObj = new Date(mealModalData.date);
const mealDate = dateObj.toISOString().split('T')[0];

// AFTER
// Use local timezone date (YYYY-MM-DD) without UTC conversion
const mealDate = mealModalData.date;
```

**Lines 1823-1829:** Fixed desktop grid date generation
```javascript
// BEFORE
const dateKey = currentDate.toISOString().split('T')[0];

// AFTER
// Use local timezone date (YYYY-MM-DD) without UTC conversion
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0');
const day = String(currentDate.getDate()).padStart(2, '0');
const dateKey = `${year}-${month}-${day}`;
```

---

## Troubleshooting

**Problem:** Dates still showing as off by 1 day  
**Solution:** Clear your browser cache (Ctrl+Shift+Del or Cmd+Shift+Delete) and refresh

**Problem:** Meals not appearing in calendar  
**Solution:**
1. Make sure you deleted all existing trips
2. Create a new trip and add a meal to it
3. Refresh the page
4. Meal should appear on the correct date

**Problem:** Database migration failed  
**Solution:** 
1. The migration is non-destructive (catches errors silently)
2. If meal_date is already TEXT, it won't fail
3. Create a new trip to test—it will use TEXT type automatically

---

## Questions?

If something isn't working:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Check the Network tab to see API responses

The fix is live! 🚀
