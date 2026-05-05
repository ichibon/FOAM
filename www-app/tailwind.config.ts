import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "foam-bg": "#FAFAFA",
        "foam-bg-secondary": "#F4F4F5",
        "foam-elevated": "#FFFFFF",
        "foam-surface": "#FFFFFF",
        "foam-border": "#E4E4E7",
        "foam-border-default": "#D4D4D8",
        "foam-accent": "#339DC7",
        "foam-accent-bright": "#3DAFD6",
        "foam-accent-hover": "#2B85A9",
        "foam-dark": "#0F2F3C",
        "foam-text": "#0A0A0A",
        "foam-text-secondary": "#525252",
        "foam-text-tertiary": "#A3A3A3",
        "foam-tint": "#E1F0F7",
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "level-1": "0 1px 3px rgba(0,0,0,0.08)",
        "level-2": "0 4px 12px rgba(0,0,0,0.10)",
        "level-3": "0 8px 24px rgba(0,0,0,0.12)",
        "level-4": "0 16px 48px rgba(0,0,0,0.15)",
        "accent-glow": "0 0 0 3px rgba(51,157,199,0.3)",
      },
      borderRadius: {
        pill: "9999px",
        card: "16px",
        input: "12px",
      },
      keyframes: {
        shine: {
          "0%": { transform: "translateX(-100%) skewX(-15deg)" },
          "100%": { transform: "translateX(300%) skewX(-15deg)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shine: "shine 2s ease-in-out infinite",
        "fade-up": "fadeUp 0.6s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
