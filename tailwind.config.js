/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // "Scoreboard" palette: dark warm ground, one accent.
      colors: {
        court: '#1b1714',            // page background
        surface: {
          DEFAULT: '#26211c',        // cards, sheets, buttons at rest
          2: '#322b25',              // avatars, inset fills
          raised: '#2e2520',         // selected / pressed rows
        },
        line: {
          DEFAULT: '#2e2823',        // hairlines between rows
          strong: '#4a4139',         // pill and chip borders
        },
        ink: {
          DEFAULT: '#f4efe8',        // primary text, Light team
          2: '#a89f94',              // secondary text
          3: '#6f665e',              // tertiary text, disabled
        },
        accent: {
          DEFAULT: '#f08a3e',        // rank, current game, primary action
          soft: '#3a2a1e',           // accent tint fill
          ink: '#1b1714',            // text on accent
        },
        danger: {
          DEFAULT: '#ea7a63',
          soft: '#3d241f',
        },
      },
      fontFamily: {
        sans: ['Barlow', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', 'sans-serif'],
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      minHeight: {
        tap: '44px',
      },
    },
  },
  plugins: [],
}
