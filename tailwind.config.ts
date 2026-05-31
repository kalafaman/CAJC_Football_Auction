import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#080808",
        foreground: "#F8FAFC",
        card: "#111111",
        muted: "#1A1A1A",
        border: "rgba(255,255,255,0.12)",
        primary: "#00FF88",
        destructive: "#FF3B5F",
      },
      boxShadow: {
        glow: "0 0 32px rgba(0,255,136,0.22)",
      },
      animation: {
        pulseGlow: "pulseGlow 1.8s ease-in-out infinite",
        sold: "sold 900ms ease-out",
        ticker: "ticker 30s linear infinite",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 14px rgba(0,255,136,0.14)" },
          "50%": { boxShadow: "0 0 34px rgba(0,255,136,0.35)" },
        },
        sold: {
          "0%": { transform: "scale(.9)", opacity: "0" },
          "45%": { transform: "scale(1.04)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
