import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
// forms plugin para padronizar inputs
import forms from "@tailwindcss/forms";

export default {
  // Garantindo que ele varra todas as subpastas da sua árvore
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        primary: { DEFAULT: "#1a355b", foreground: "#FFFFFF" }, // Azul Militar (novo)
        secondary: { DEFAULT: "#0078D4", foreground: "#FFFFFF" }, // Azul Digital
        success: { DEFAULT: "#2D5A27", foreground: "#FFFFFF" }, // Verde Militar
        alert: { DEFAULT: "#E67E22", foreground: "#FFFFFF" }, // Laranja
        error: { DEFAULT: "#C0392B", foreground: "#FFFFFF" }, // Vermelho
        "military-gold": { DEFAULT: "#F59E0B", foreground: "#000000" }, // Ouro Militar
        canvas: { DEFAULT: "#F4F7F9" }, // Fundo Gelo (light)
        "background-light": { DEFAULT: "#f6f7f8" }, // Background claro
        "background-dark": { DEFAULT: "#13181f" }, // Background escuro

        /* semantic tokens backed by CSS variables */
        "bg-default": "var(--bg-default)",
        "bg-card": "var(--bg-card)",
        "text-body": "var(--text-body)",
        "text-muted": "var(--text-muted)",
        "text-inverted": "var(--text-inverted)",
        "border-default": "var(--border-default)",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
        display: ["Public Sans", "Inter", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem", // 8px
        md: "0.375rem", // 6px (Padrão dos inputs)
        sm: "0.25rem", // 4px
        "2xl": "1rem", // 16px
        "3xl": "1.5rem", // 24px
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
  plugins: [animate, forms],
} satisfies Config;
