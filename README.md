# Group Trip Organizer

Live shared app for coordinating what everyone's bringing to a group trip.

## Features

✅ **Live sync** — Everyone sees updates instantly (no import/export needed)
✅ **Multiple trips** — Organize different trips (moose-25, weekend-trip, etc.)
✅ **Shared checklist** — One unified view of everything everyone's bringing
✅ **Persistent database** — Data saved in Vercel Postgres

## Deploy to Vercel (5 minutes)

### 1. Push to GitHub

```bash
cd trip-organizer-app

# Initialize git repo
git init
git add .
git commit -m "Initial commit: Group Trip Organizer"

# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/trip-organizer.git
git branch -M main
git push -u origin main
```

### 2. Connect to Vercel

1. Go to **vercel.com** → Sign in with GitHub
2. Click **Add New** → **Project**
3. Select the `trip-organizer` repo
4. Click **Import**

Vercel will auto-detect it's a Node.js app.

### 3. Add the Database

1. In the Vercel project dashboard, go to **Storage** tab
2. Click **Create Database** → Select **Postgres**
3. Name it `trip-organizer-db`
4. Click **Create**

Vercel automatically adds `POSTGRES_URL` to your environment variables.

### 4. Deploy

Click **Deploy**. Vercel builds and deploys automatically.

**Your app is now live at: `https://trip-organizer.vercel.app`**

Share that URL with your group!

## Local Development

```bash
npm install
npm run dev
```

Server runs on `http://localhost:3000`

Note: You'll need to set the `POSTGRES_URL` environment variable locally (copy from Vercel dashboard).

## How It Works

- **Frontend**: React-free, vanilla JS with real-time sync every 2 seconds
- **Backend**: Express.js server
- **Database**: Vercel Postgres
- **Live updates**: Everyone in the trip sees changes instantly

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/trips/:tripId/items` | GET | Fetch all items for a trip |
| `/api/trips/:tripId/items` | POST | Add new item |
| `/api/trips/:tripId/items/:id` | PATCH | Update item (check off, edit) |
| `/api/trips/:tripId/items/:id` | DELETE | Delete item |

## Tips

- **Switch trips**: Use the Trip selector at the top to organize different events
- **Check items off**: Click the checkbox to mark things as confirmed/acquired
- **Category filters**: Items are grouped by category for easy scanning
