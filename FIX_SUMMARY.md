# Timezone Bug Fix Summary

## The Problem

Your app had **two timezone bugs** causing dates to display wrong:

### Bug #1: Backend Date Storage (server.js)
- `trip_meals.meal_date` was stored as PostgreSQL `DATE` type
- When Postgres stores a DATE, it applies UTC timezone conversion
- Result: Aug 22 in your timezone → Aug 21 in database

### Bug #2: Frontend Date Generation (index.html)
- When creating a meal: `new Date().toISOString().split('T')[0]` assumes UTC
- When rendering calendar grid: same UTC conversion
- Result: Aug 22 in UI → Aug 21 sent to backend

### The Cascade Effect
1. User picks Aug 22 for a meal
2. Frontend converts to UTC: Aug 21
3. Backend applies DATE conversion: Aug 21 (double timezone offset)
4. Calendar grid looks for Aug 22 meals → finds nothing
5. Meals don't appear in calendar ❌

---

## The Solution

### Backend Fix (server.js)

**Changed:** `trip_meals.meal_date` from `DATE` to `TEXT`

This means:
- Dates stored as plain strings: `"2026-08-22"`
- No timezone conversion applied
- What you see is what you get

**Code changes:**
1. Line 19: `meal_date DATE` → `meal_date TEXT`
2. Lines 48-52: Added migration to convert existing DATE columns to TEXT
3. Lines 234-240: Removed date conversion in GET endpoint
4. Lines 257-263: Removed date conversion in POST endpoint

### Frontend Fix (index.html)

**Changed:** How dates are formatted when sent to backend and displayed

**Bug Fix #1 - saveMeal function (lines 2107-2111):**
```javascript
// OLD: Converts to UTC via toISOString
const dateObj = new Date(mealModalData.date);
const mealDate = dateObj.toISOString().split('T')[0];

// NEW: Uses date string as-is (already in local timezone)
const mealDate = mealModalData.date;
```

**Bug Fix #2 - Desktop grid rendering (lines 1823-1829):**
```javascript
// OLD: Converts to UTC via toISOString
const dateKey = currentDate.toISOString().split('T')[0];

// NEW: Builds date string in local timezone
const year = currentDate.getFullYear();
const month = String(currentDate.getMonth() + 1).padStart(2, '0');
const day = String(currentDate.getDate()).padStart(2, '0');
const dateKey = `${year}-${month}-${day}`;
```

---

## What This Fixes

✅ **Dates display correctly** in meal modals (no more -1 day offset)  
✅ **Trip admin shows correct dates** (no more -1 day offset)  
✅ **Meals appear in the calendar** (dates match properly)  
✅ **No more "missing" meals** when switching between views  
✅ **Calendar and modals show the same date** (consistency)

---

## How to Deploy

### Quick Version
1. Replace `server.js` with the fixed version
2. Replace `public/index.html` with the fixed version
3. Push to GitHub → Vercel auto-deploys
4. Delete all existing trips from database
5. Create one test trip to verify

### Detailed Steps
See **TIMEZONE_FIX_GUIDE.md** for full deployment instructions

---

## Testing

After deployment:

1. Create a new trip starting **today**
2. Add a meal to **today's date**
3. Verify:
   - ✓ Modal shows today's date (not yesterday)
   - ✓ Calendar displays meal on today (not yesterday)
   - ✓ Admin card shows correct start date

If all three match → **Fix is working!** 🎉

---

## Technical Details

**Root Cause:** JavaScript's `toISOString()` and PostgreSQL's `DATE` type both apply UTC timezone transformations. When both apply, dates shift by 1 day for anyone not in UTC.

**The Fix:** Store dates as TEXT (strings) in local timezone. No transformations = no timezone issues.

**Why TEXT instead of TIMESTAMP?** 
- TIMESTAMP would still apply timezone conversion
- TEXT preserves the exact date the user entered
- Simple, reliable, no hidden conversions

**What about historical data?**
- After applying this fix, you can reload historical trips
- Use `seed-historical-trips.js` with the new schema
- All dates will be correct going forward
