/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          accent: "rgb(var(--brand-accent) / <alpha-value>)",
          accent2: "rgb(var(--brand-accent-2) / <alpha-value>)",
          bg: "rgb(var(--brand-bg) / <alpha-value>)",
          panel: "rgb(var(--brand-panel) / <alpha-value>)",
          panel2: "rgb(var(--brand-panel-2) / <alpha-value>)"
        }
      }
    },
  },
  plugins: [],
}

