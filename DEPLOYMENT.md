# Quick Deployment Guide

## Vercel Deployment (Recommended)

### First Time Setup

1. Create a GitHub repository and push your code:
```bash
# If you haven't created a GitHub repo yet:
# Go to github.com and create a new repository named "basketball-stats-app"

git remote add origin https://github.com/YOUR_USERNAME/basketball-stats-app.git
git branch -M main
git push -u origin main
```

2. Deploy to Vercel:
   - Go to https://vercel.com
   - Sign in with GitHub
   - Click "New Project"
   - Import your `basketball-stats-app` repository
   - Click "Deploy" (Vercel auto-detects Vite settings)

3. Your app will be live at: `https://basketball-stats-app-YOUR_USERNAME.vercel.app`

### Updating Data

After deployment, whenever you want to add new session data:

```bash
# 1. Edit src/data/stats.json (add your new session)

# 2. Commit and push
git add src/data/stats.json
git commit -m "Add session from 2025-02-05"
git push

# 3. Vercel automatically redeploys (takes ~1 minute)
```

## Netlify Deployment

1. Create GitHub repo (same as Vercel step 1)

2. Deploy to Netlify:
   - Go to https://netlify.com
   - Sign in with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy"

3. Your app will be live at: `https://basketball-stats-app.netlify.app`

## Checking Your Deployment

After deployment:
1. Visit your live URL
2. Verify the Player Summary page shows all players
3. Click "Session Log" to see all sessions
4. Test on mobile by opening the URL on your phone
5. Share the URL with your friends!

## Troubleshooting

**Build fails**:
- Check that all files are committed: `git status`
- Verify the build works locally: `npm run build`

**Data not updating**:
- Make sure you pushed to the correct branch (usually `main`)
- Check the deployment logs on Vercel/Netlify

**404 errors on page refresh**:
- Vercel/Netlify should handle this automatically for single-page apps
- If issues persist, check your platform's SPA routing settings
