/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        lima: "#E7F2E4",
        verde: "#4A7C30",
        pistacho: "#B1D923",
        naranja: "#F27405",
        blanco: "#F2F2F2",
      },
    },
  },
  plugins: [],
};
