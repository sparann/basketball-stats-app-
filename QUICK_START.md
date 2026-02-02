# Quick Start - For After Setup

This is a quick reference once you've completed the initial setup.

## Adding a New Session (The Easy Way!)

1. Go to your app URL
2. Click **"Admin"** tab
3. Login with your password
4. Fill in the form:
   - Date
   - Player names, games played, games won
   - Notes (optional)
5. Click **"Add Session"**
6. Done! Stats update immediately ✅

## What Your Friends See

When you share the URL with friends, they see:
- ✅ Player Summary (win percentages, stats)
- ✅ Session Log (full history)
- ❌ Cannot access Admin panel (password protected)

## Important URLs

Save these for quick access:

- **Your App**: [Set this after deploying to Vercel]
- **Supabase Dashboard**: https://app.supabase.com/project/_/editor
- **Vercel Dashboard**: https://vercel.com/dashboard

## Common Tasks

### Change Admin Password

1. Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Edit `VITE_ADMIN_PASSWORD`
4. Redeploy

### View Your Database

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select "sessions" table
4. See all your data

### Check Deployment Status

1. Go to Vercel Dashboard
2. Click on your project
3. See latest deployment status

## Tips

- **Backup your data**: Click "Export to CSV" in Session Log tab
- **Test first**: Add a test session to make sure everything works
- **Mobile friendly**: The admin panel works great on phones too!
- **No refresh needed**: After adding a session, the stats update automatically

## Need the Full Guide?

See `SETUP_GUIDE.md` for the complete setup instructions.
