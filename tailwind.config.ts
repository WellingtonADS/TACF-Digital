import type { Config } from "tailwindcss";
// @ts-ignore - plugin de animações é padrão para Radix
import animate from "tailwindcss-animate";

export default {
  // Garantindo que ele varra todas as subpastas da sua árvore
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1B365D" },
        secondary: { DEFAULT: "#0078D4" },
        success: { DEFAULT: "#2D5A27" },
        alert: { DEFAULT: "#E67E22" },
        error: { DEFAULT: "#C0392B" },
        canvas: { DEFAULT: "#F4F7F9" },
      },
      fontFamily: {
        inter: ["Inter", "system-ui", "sans-serif"],
      },
      // Adicionando animações para os componentes Radix (Select/Modal)
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
