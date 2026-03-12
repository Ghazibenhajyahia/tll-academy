import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "green-dark": "#0d1f17",
        green: "#1a3a2a",
        "green-mid": "#2a5a40",
        "green-light": "#3a7a55",
        gold: "#c9a96e",
        "gold-light": "#e2c99a",
        cream: "#f5f0e8",
        grey: "#8a9a90",
        "grey-light": "#c8d4cc",
        correct: "#27ae60",
        wrong: "#c0392b",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', "serif"],
        sans: ['"Jost"', "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.7s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
