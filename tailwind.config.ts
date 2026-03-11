import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
// forms plugin para padronizar inputs
import forms from "@tailwindcss/forms";

const scaleFromVar = (cssVar: string) => ({
  50: `rgb(var(${cssVar}) / 0.08)`,
  100: `rgb(var(${cssVar}) / 0.14)`,
  200: `rgb(var(${cssVar}) / 0.22)`,
  300: `rgb(var(${cssVar}) / 0.36)`,
  400: `rgb(var(${cssVar}) / 0.52)`,
  500: `rgb(var(${cssVar}) / 0.72)`,
  600: `rgb(var(${cssVar}) / 0.84)`,
  700: `rgb(var(${cssVar}) / 0.92)`,
  800: `rgb(var(${cssVar}) / 0.96)`,
  900: `rgb(var(${cssVar}) / 1)`,
  DEFAULT: `rgb(var(${cssVar}) / <alpha-value>)`,
});

const slateScale = {
  50: "rgb(var(--color-bg-default) / 1)",
  100: "rgb(var(--color-bg-default) / 0.9)",
  200: "rgb(var(--color-border-default) / 1)",
  300: "rgb(var(--color-border-default) / 0.8)",
  400: "rgb(var(--color-text-muted) / 0.95)",
  500: "rgb(var(--color-text-muted) / 1)",
  600: "rgb(var(--color-text-body) / 0.85)",
  700: "rgb(var(--color-text-body) / 1)",
  800: "rgb(var(--color-primary) / 0.9)",
  900: "rgb(var(--color-primary) / 1)",
  DEFAULT: "rgb(var(--color-text-body) / <alpha-value>)",
};

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
        primary: {
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
          foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
          foreground: "rgb(var(--color-secondary-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          foreground: "rgb(var(--color-success-foreground) / <alpha-value>)",
        },
        alert: {
          DEFAULT: "rgb(var(--color-alert) / <alpha-value>)",
          foreground: "rgb(var(--color-alert-foreground) / <alpha-value>)",
        },
        error: {
          DEFAULT: "rgb(var(--color-error) / <alpha-value>)",
          foreground: "rgb(var(--color-error-foreground) / <alpha-value>)",
        },
        "military-gold": {
          DEFAULT: "rgb(var(--color-military-gold) / <alpha-value>)",
          foreground:
            "rgb(var(--color-military-gold-foreground) / <alpha-value>)",
        },
        canvas: { DEFAULT: "rgb(var(--color-bg-default) / <alpha-value>)" },
        "background-light": {
          DEFAULT: "rgb(var(--color-bg-default) / <alpha-value>)",
        },

        /* semantic tokens backed by CSS variables */
        "bg-default": "rgb(var(--color-bg-default) / <alpha-value>)",
        "bg-card": "rgb(var(--color-bg-card) / <alpha-value>)",
        "text-body": "rgb(var(--color-text-body) / <alpha-value>)",
        "text-muted": "rgb(var(--color-text-muted) / <alpha-value>)",
        "text-inverted": "rgb(var(--color-text-inverted) / <alpha-value>)",
        "border-default": "rgb(var(--color-border-default) / <alpha-value>)",

        // Compatibility aliases so existing pages follow the new palette.
        emerald: scaleFromVar("--color-success"),
        green: scaleFromVar("--color-success"),
        amber: scaleFromVar("--color-alert"),
        red: scaleFromVar("--color-error"),
        violet: scaleFromVar("--color-secondary"),
        slate: slateScale,
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
