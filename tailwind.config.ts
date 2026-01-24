import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta Militar (FAB)
        "fab-blue": "#0047AB", // Azul Aeronáutica (Primary)
        "fab-gold": "#FFB81C", // Ouro/Amarelo (Secondary)
        "fab-dark": "#1E3A5F", // Azul Escuro
      },
    },
  },
  plugins: [],
} satisfies Config;
