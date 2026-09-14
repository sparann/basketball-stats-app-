/** @type {import('tailwindcss').Config} */

// Theme tokens live as RGB triplets in src/index.css (:root = dark, [data-theme="light"] = light).
// This form keeps opacity modifiers like bg-court/95 working.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        court: token('court'),                 // page background
        surface: {
          DEFAULT: token('surface'),           // cards, sheets, buttons at rest
          2: token('surface-2'),               // avatars, inset fills
          raised: token('surface-raised'),     // selected / pressed rows
        },
        line: {
          DEFAULT: token('line'),              // hairlines between rows
          strong: token('line-strong'),        // pill and chip borders
        },
        ink: {
          DEFAULT: token('ink'),               // primary text
          2: token('ink-2'),                   // secondary text
          3: token('ink-3'),                   // tertiary text, disabled
        },
        accent: {
          DEFAULT: token('accent'),            // rank, current game, primary action
          soft: token('accent-soft'),          // accent tint fill
          ink: token('accent-ink'),            // text on accent
        },
        danger: {
          DEFAULT: token('danger'),
          soft: token('danger-soft'),
        },
        // Shirt colours do not follow the theme: Light is always light, Dark always dark.
        shirt: {
          light: '#f4efe8',
          'light-ink': '#1b1714',
          dark: '#1b1714',
          'dark-ink': '#f4efe8',
          'dark-line': '#4a4139',
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
