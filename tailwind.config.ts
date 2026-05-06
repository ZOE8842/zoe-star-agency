import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        champagne: {
          DEFAULT: "#C9A86A",
          50: "#FBF8F1",
          100: "#F4ECD9",
          200: "#E8D9B3",
          300: "#DBC58D",
          400: "#CFB276",
          500: "#C9A86A",
          600: "#A98A55",
          700: "#876D43",
          800: "#5E4C2F",
          900: "#3F331F",
        },
        // theme-aware: tausch im Light-Mode ink<->cream via CSS-Variable
        cream: {
          DEFAULT: "rgb(var(--c-fg) / <alpha-value>)",
          50: "#FBFAF5",
          100: "#F4F1E7",
          200: "#EDE7D8",
          300: "#E0D7BD",
        },
        ink: {
          DEFAULT: "rgb(var(--c-bg) / <alpha-value>)",
          50: "#1A1A1A",
          100: "#141414",
          200: "#0F0F0F",
          300: "#0A0A0A",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        "ultra-wide": "0.4em",
      },
      animation: {
        "fade-up": "fadeUp 600ms ease-out forwards",
        "fade-in": "fadeIn 400ms ease-out forwards",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
