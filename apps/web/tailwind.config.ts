import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1A5CA8",
        primaryTint: "#EAF2FB",
        darkText: "#1A1A1A",
        midText: "#444444",
        mutedText: "#777777",
        border: "#DDDDDD",
        background: "#F7F9FC",
        success: "#1D9E75",
        warning: "#BA7517",
        danger: "#E24B4A",
        escrow: "#7F77DD",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
