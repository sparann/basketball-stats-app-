# Basketball Stats Tracker

A simple, clean React web app for tracking pickup basketball win percentages with historical session data. View-only for friends, with easy data updates via JSON file editing.

## Features

- **Player Summary Dashboard**: Card-based view showing overall stats for each player
  - Win percentage with color coding (green >70%, yellow 50-70%, red <50%)
  - Total games played and won
  - Sessions attended
  - Last played date
  - Performance trend chart

- **Session Log**: Complete history of all basketball sessions
  - Sortable columns
  - Filter by player
  - Export to CSV
  - Show/hide notes

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

## Live Demo

🔗 [View the app here](#) _(Update this with your deployed URL)_

## How to Add New Data

### 1. Edit the Data File

Open `src/data/stats.json` in any text editor. The file structure looks like this:

```json
{
  "sessions": [
    {
      "date": "2025-01-15",
      "players": [
        {
          "name": "Mike Johnson",
          "gamesPlayed": 10,
          "gamesWon": 7,
          "notes": "Great shooting day"
        }
      ]
    }
  ]
}
```

### 2. Add a New Session

To add a new session, append a new object to the `sessions` array:

```json
{
  "date": "2025-02-05",
  "players": [
    {
      "name": "Mike Johnson",
      "gamesPlayed": 15,
      "gamesWon": 11,
      "notes": ""
    },
    {
      "name": "Sarah Chen",
      "gamesPlayed": 15,
      "gamesWon": 10,
      "notes": "Back after a break"
    }
  ]
}
```

**Important Notes**:
- Date format: `YYYY-MM-DD`
- `gamesPlayed` and `gamesWon` must be numbers
- `notes` can be empty (`""`) or contain text
- Don't forget commas between objects
- New players are automatically added to the system

### 3. Deploy the Update

Once you've edited the JSON file:

```bash
git add src/data/stats.json
git commit -m "Add session from 2025-02-05"
git push
```

The app will auto-deploy within 1-2 minutes (depending on your hosting platform).

## Local Development

### Prerequisites

- Node.js 16+ and npm

### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd basketball-stats-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `dist/` folder.

## Deployment Options

### Option 1: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel auto-detects Vite and configures everything
6. Click "Deploy"

**Auto-deploy**: Every push to `main` branch triggers a new deployment.

### Option 2: Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub and select your repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy"

**Auto-deploy**: Every push to `main` branch triggers a new deployment.

### Option 3: GitHub Pages

1. Add to `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  base: '/basketball-stats-app/' // Replace with your repo name
})
```

2. Add to `package.json`:

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

3. Install gh-pages:

```bash
npm install --save-dev gh-pages
```

4. Deploy:

```bash
npm run deploy
```

**URL**: `https://yourusername.github.io/basketball-stats-app`

## Tech Stack

- **Framework**: Vite + React 18
- **Language**: JavaScript
- **Styling**: Plain CSS with CSS variables
- **Data**: Static JSON file
- **Hosting**: Vercel/Netlify/GitHub Pages

## Project Structure

```
basketball-stats-app/
├── src/
│   ├── data/
│   │   └── stats.json          # All session data
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── PlayerCard.jsx
│   │   ├── PlayerSummary.jsx
│   │   └── SessionLog.jsx
│   ├── utils/
│   │   └── calculations.js     # Win % calculations
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── package.json
└── README.md
```

## Future Enhancement Ideas

- Add charts for win % trends over time
- Head-to-head comparison between players
- Session MVP badges
- Dark mode toggle
- Export stats as images for social media
- Simple admin panel for in-browser editing

## Questions or Issues?

Open an issue on GitHub or contact the project maintainer.

---

Made with ❤️ and 🏀
