# Live Session Mode - Setup Guide

This guide will help you set up and use the new Live Session Mode for real-time game tracking.

## Features

- **Real-time game tracking**: Record individual games as they happen
- **Quick courtside entry**: Less than 1 minute between games
- **Mobile-optimized**: Large touch targets and thumb-zone optimization
- **Smart roster updates**: Handle team rotation logic automatically
- **Team validation**: Ensures equal team sizes before starting
- **Backwards compatible**: Converts to existing sessions format on completion
- **Game-by-game analytics**: Preserves detailed data for future "who wins with who" analysis

## Database Setup

### Step 1: Run the Migration

1. Open your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `supabase/migrations/20250204_create_live_sessions.sql`
4. Paste and run the SQL migration

This will create three new tables:
- `live_sessions` - Container for live sessions
- `live_session_players` - Player statistics within sessions
- `games` - Individual game records with team rosters

### Step 2: Verify Tables

In your Supabase dashboard, go to Table Editor and verify the following tables exist:
- `live_sessions`
- `live_session_players`
- `games`

Check that Row Level Security (RLS) is enabled with public access policies.

## How to Use

### Starting a Live Session

1. Navigate to the **Admin Panel** → **Sessions** tab
2. Click **"▶ Start Live Session"** (green button)
3. Fill out the form:
   - **Date**: Defaults to today
   - **Location**: Optional, select from your locations
   - **Select Players**: Choose at least 4 players
4. Click **"Start Live Session"**

### Setting Up Teams

1. After starting, you'll see three columns: **Team A**, **Team B**, and **Bench**
2. Tap players from the bench to assign them to teams
3. Use the blue/red buttons to add players to each team
4. Teams must be equal size before you can start playing

### Recording Games

1. Once teams are set up, you'll see two large buttons:
   - **TEAM A WON** (blue)
   - **TEAM B WON** (red)
2. Tap the winner button after each game
3. The app will automatically:
   - Save the game result
   - Update player statistics
   - Open the roster update modal

### Updating Rosters Between Games

After marking a winner, the **Quick Roster Modal** appears:

1. **Losing team players**: Tap to mark who sits out
2. **Bench players**: Tap to add to the losing team
3. **Validation**: Teams must remain equal size
4. Click **"Start Next Game"** when ready

**Rotation Logic**:
- Winners stay on their team
- Losers shoot to decide who stays/sits
- Players who sit join the bench
- Bench players fill empty spots on losing team

### Ending the Session

1. Click **"End"** in the top-right corner
2. Review the session summary:
   - Total games played
   - Player statistics
   - Top performer
   - Session duration
3. Click **"Save & End Session"** to:
   - Mark session as completed
   - Convert to legacy sessions format
   - Preserve game-by-game data for analytics

### Resuming a Session

If you exit during a live session:
1. The session remains **active**
2. A green banner appears in the Sessions tab
3. Click **"Resume"** to continue where you left off
4. All rosters and stats are preserved

## Features in Detail

### Undo Last Game

- Click the **↶** button in the top-right
- Reverts the most recent game
- Restores previous rosters and stats
- Useful for correcting mistakes

### Offline Support

- Session data is automatically backed up to localStorage every 30 seconds
- If you lose connection, changes are queued
- Data syncs when connection is restored

### Wake Lock

- On mobile, the screen stays awake during live sessions
- Prevents accidental screen timeout courtside

### Mobile Optimization

- Full-screen layout for maximum space
- Large touch targets (48x48px minimum)
- Bottom-aligned action buttons for thumb access
- Portrait-optimized layout

## Data Structure

### Live Sessions Table

```sql
live_sessions (
  id uuid PRIMARY KEY,
  date date NOT NULL,
  location text,
  status text ('active', 'completed', 'abandoned'),
  started_at timestamp,
  ended_at timestamp,
  created_by text,
  metadata jsonb
)
```

### Games Table

```sql
games (
  id uuid PRIMARY KEY,
  live_session_id uuid REFERENCES live_sessions,
  game_number integer,
  team_a_players jsonb,
  team_b_players jsonb,
  sitting_out_players jsonb,
  winning_team text ('team_a', 'team_b'),
  played_at timestamp,
  notes text,
  metadata jsonb
)
```

### Live Session Players Table

```sql
live_session_players (
  id uuid PRIMARY KEY,
  live_session_id uuid REFERENCES live_sessions,
  player_name text,
  total_games_played integer,
  total_games_won integer
)
```

## Troubleshooting

### "No players available" error
- Make sure you've added players in the **Players** tab first
- At least 4 players are required to start a live session

### Teams won't validate
- Ensure both teams have the exact same number of players
- You can move players between teams and bench until sizes match

### Session not appearing after ending
- Check that Supabase is properly configured
- Verify the migration ran successfully
- Check browser console for any errors

### Resume button not showing
- Active sessions are stored in `live_sessions` table with `status='active'`
- Check Supabase to verify the session exists
- Refresh the page to re-check for active sessions

## Future Analytics

The game-by-game data enables powerful analytics:

- **Player Chemistry**: See which player combinations win most
- **Team Composition**: Analyze winning team makeups
- **Performance Trends**: Track how players perform over time
- **Best Pairings**: Identify which players win together

Game records are preserved in the `games` table with full roster information for each game.

## File Structure

```
src/components/LiveSession/
├── LiveSessionContext.jsx       # State management and database operations
├── LiveSessionInterface.jsx     # Main full-screen interface
├── StartLiveSessionModal.jsx    # Initial session setup
├── QuickRosterModal.jsx         # Between-game roster updates
├── EndSessionModal.jsx          # Session summary and save
├── TeamColumn.jsx               # Team display component
├── PlayerCard.jsx               # Individual player card
└── WinnerButtons.jsx            # Large game winner buttons
```

## Support

For issues or questions:
- Check this guide first
- Review the migration file for database schema
- Check browser console for error messages
- Verify Supabase connection and RLS policies
