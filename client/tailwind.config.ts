import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Rubik", "sans-serif"],
      },
      colors: {
        primary: "#A729F5",
        success: "#26D782",
        error: "#EE5454",
        "dark-bg": "#313E51",
        "dark-card": "#3B4D66",
        "dark-text": "#FFF",
        "dark-text-secondary": "#ABC1E1",
        "light-bg": "#F4F6FA",
        "light-card": "#FFF",
        "light-text": "#313E51",
        "light-text-secondary": "#626C7F",
      },
    },
  },
  plugins: [],
};
export default config;
