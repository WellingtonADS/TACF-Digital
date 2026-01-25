import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // TACF-Digital Design Tokens
        primary: {
          DEFAULT: "#1B365D",
        },
        secondary: {
          DEFAULT: "#0078D4",
        },
        success: {
          DEFAULT: "#2D5A27",
        },
        alert: {
          DEFAULT: "#E67E22",
        },
        error: {
          DEFAULT: "#C0392B",
        },
        canvas: {
          DEFAULT: "#F4F7F9",
        },
      },
      fontFamily: {
        inter: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
