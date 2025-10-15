/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Palette 1: Modern Lavender & Warm Yellow ---
        'soft-white': '#F7F7FF',        // Background
        'deep-violet': '#353549',       // Text/Borders (Very Dark Gray)
        'brand-lavender': '#8870C0',    // Primary Brand Color (Active BG)
        'cheerful-yellow': '#FFC759',   // Accent/Success
        'salmon-pink': '#FF7B9C',       // Hover/Event Accent
        'text-muted': '#4A4E69',        // Secondary text color

        // --- Palette 2: Red and Green pastel
        'emerald-mint': '#55E6A3',      // Brand/Active
        'rose-clay': '#A66F67',         // Muted event 2
        'forest-noir': '#2D3C35',       // Primary Base
        'canyon-sunset': '#E66855',     // Accent/CTA
        'sage-mist': '#66917D',         // Muted event 1
        'truffle-gray': '#665B59',      // Secondary Base
      }
    },
  },
  plugins: [],
}
