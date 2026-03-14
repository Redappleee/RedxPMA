import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./ui/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"]
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        danger: "hsl(var(--danger))"
      },
      boxShadow: {
        glow: "0 10px 45px -15px rgba(50, 90, 255, 0.45)",
        soft: "0 10px 40px -20px rgba(0, 0, 0, 0.28)"
      },
      backgroundImage: {
        hero: "radial-gradient(circle at 20% 20%, rgba(78, 214, 194, 0.22), transparent 40%), radial-gradient(circle at 80% 30%, rgba(44, 103, 254, 0.24), transparent 40%), linear-gradient(120deg, rgba(255,255,255,0.9), rgba(246,249,255,0.8))",
        "hero-dark": "radial-gradient(circle at 20% 20%, rgba(20, 177, 153, 0.25), transparent 40%), radial-gradient(circle at 80% 30%, rgba(71, 116, 250, 0.32), transparent 40%), linear-gradient(120deg, rgba(5,8,17,0.96), rgba(15,22,41,0.92))"
      },
      animation: {
        pulseSoft: "pulseSoft 2.2s ease-in-out infinite"
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { opacity: "0.75" },
          "50%": { opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
