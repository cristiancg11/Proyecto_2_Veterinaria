/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "surface-dim": "#0a0e17",
        "surface": "#0b0f19",
        "surface-container-lowest": "#060911",
        "surface-container-low": "#0f172a",
        "surface-container": "#151e34",
        "surface-container-high": "#1e293b",
        "surface-container-highest": "#283548",
        "surface-bright": "#334155",
        "on-surface": "#f1f5f9",
        "on-surface-variant": "#94a3b8",
        "outline": "#64748b",
        "outline-variant": "#334155",
        "primary": "#3b82f6",
        "primary-container": "#2563eb",
        "on-primary": "#ffffff",
        "secondary": "#38bdf8",
        "secondary-container": "#0284c7",
        "error": "#ef4444",
        "error-container": "#7f1d1d",
        urgent: {
          critical: "#ef4444",
          moderate: "#f59e0b",
          mild: "#06b6d4",
        },
        clinical: {
          indigo: "#6366f1",
          royal: "#3b82f6",
          cyan: "#06b6d4",
          teal: "#14b8a6",
          violet: "#8b5cf6",
          amber: "#f59e0b",
          ink: "#0b0f19",
          surface: "#111827",
        },
        biotech: {
          abyss: "#030712",
          deep: "#0b0f19",
          void: "#030712",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        "clinical-canvas":
          "radial-gradient(1200px 620px at 6% -12%, rgba(37,99,235,0.22), transparent 56%), radial-gradient(1040px 560px at 100% 0%, rgba(56,189,248,0.18), transparent 50%), radial-gradient(900px 720px at 50% 120%, rgba(21,30,52,0.8), transparent 62%), linear-gradient(180deg, #060911 0%, #0b0f19 50%, #060911 100%)",
        "glass-sheen":
          "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.02) 26%, transparent 60%)",
        "cta-gradient":
          "linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #38bdf8 100%)",
        "urgency-preventive":
          "linear-gradient(135deg, rgba(8,51,68,0.95) 0%, rgba(6,182,212,0.42) 100%)",
        "urgency-watch":
          "linear-gradient(135deg, rgba(120,53,15,0.95) 0%, rgba(245,158,11,0.45) 100%)",
        "urgency-critical":
          "linear-gradient(135deg, rgba(127,29,29,0.96) 0%, rgba(225,29,72,0.48) 100%)",
      },
      boxShadow: {
        clinical: "0 24px 50px -28px rgba(37, 99, 235, 0.4)",
        depth: "0 8px 32px rgba(6, 9, 17, 0.7)",
        "depth-lg": "0 24px 60px -20px rgba(6, 9, 17, 0.8)",
        "glow-indigo": "0 0 26px rgba(37, 99, 235, 0.35)",
        "glow-cyan": "0 0 26px rgba(56, 189, 248, 0.30)",
        "inner-hi": "inset 0 1px 0 rgba(255, 255, 255, 0.08)",
      },
      keyframes: {
        aurora: {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)", opacity: "0.75" },
          "50%": { transform: "translate3d(4%, -3%, 0) scale(1.12)", opacity: "1" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "urgent-pulse": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(239,68,68,0.55)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 0 8px rgba(239,68,68,0)" },
        },
      },
      animation: {
        aurora: "aurora 16s ease-in-out infinite",
        "aurora-rev": "aurora 22s ease-in-out infinite reverse",
        "float-slow": "float-slow 7s ease-in-out infinite",
        "urgent-pulse": "urgent-pulse 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
