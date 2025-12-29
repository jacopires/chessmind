/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#8b5cf6", // violet-500
        "primary-dark": "#7c3aed", // violet-600
        "primary-light": "#a78bfa", // violet-400
        "background-light": "#f6f6f8",
        "background-dark": "#020617", // slate-950 (The Void)
        "surface-dark": "#1a1625", // Dark purple tint surface
        "surface-darker": "#13101b", // Even darker surface
        "border-color": "#2e293b", // Purple-tinted border
      },
      fontFamily: {
        "display": ["Inter", "sans-serif"],
        "mono": ["JetBrains Mono", "monospace"]
      },
      borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px" },
      boxShadow: {
        'neon': '0 0 15px rgba(139, 92, 246, 0.3)',
        'glow-lg': '0 20px 70px -10px rgba(0, 0, 0, 0.8)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
}
