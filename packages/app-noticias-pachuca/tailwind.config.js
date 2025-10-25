/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Brutalist color palette from public-noticias
        brutalist: {
          brown: "#854836", // Primary brown
          yellow: "#FFB22C", // Accent yellow
          red: "#FF0000", // Hover red
          gray: "#F7F7F7", // Background light
          black: "#000000", // Borders
        },
        // Semantic colors based on brutalist palette
        primary: "#854836",
        secondary: "#FFB22C",
        accent: "#FFB22C",
        background: "#F7F7F7",
        foreground: "#000000",
      },
      fontFamily: {
        // System fonts from public-noticias
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "Fira Sans",
          "Droid Sans",
          "Helvetica Neue",
          "sans-serif",
        ],
        mono: [
          "source-code-pro",
          "Menlo",
          "Monaco",
          "Consolas",
          "Courier New",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
