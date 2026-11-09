/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        urgent: {
          critical: "#ef4444",
          moderate: "#f59e0b",
          mild: "#10b981",
        },
        clinical: {
          emerald: "#10b981",
          cyan: "#06b6d4",
          amber: "#f59e0b",
          ink: "#0f172a",
          surface: "#18181b",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        "clinical-canvas":
          "radial-gradient(1100px 520px at 8% -12%, rgba(16,185,129,0.18), transparent 58%), radial-gradient(860px 460px at 100% 0%, rgba(6,182,212,0.14), transparent 52%), linear-gradient(180deg, #020617 0%, #0f172a 48%, #09090b 100%)",
        "urgency-preventive":
          "linear-gradient(135deg, rgba(6,78,59,0.95) 0%, rgba(16,185,129,0.42) 100%)",
        "urgency-watch":
          "linear-gradient(135deg, rgba(120,53,15,0.95) 0%, rgba(245,158,11,0.45) 100%)",
        "urgency-critical":
          "linear-gradient(135deg, rgba(127,29,29,0.96) 0%, rgba(225,29,72,0.48) 100%)",
      },
      boxShadow: {
        clinical: "0 24px 50px -28px rgba(6, 78, 59, 0.55)",
      },
    },
  },
  plugins: [],
};
