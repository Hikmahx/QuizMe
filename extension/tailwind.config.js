/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx,html}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: { sans: ["Rubik", "ui-sans-serif", "system-ui", "sans-serif"] },
      colors: {
        primary: "#a729f5",
        success: "#26d782",
        error: "#ee5454",
        app: {
          bg: "var(--app-bg)",
          card: "var(--app-card)",
          text: "var(--app-text)",
          "text-secondary": "var(--app-text-secondary)"
        }
      }
    }
  },
  plugins: []
}