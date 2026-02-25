/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
        background: "#f8fafc",
      }
    },
  },
  plugins: [],
}
