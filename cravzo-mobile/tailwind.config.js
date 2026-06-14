/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#4f46e5",
          dark: "#1e1b4b",
          800: "#3730a3",
          700: "#4338ca",
          100: "#e0e7ff",
          50: "#eef2ff",
        },
        accent: {
          coral: "#ff6b5f",
          "coral-dark": "#ff5a47",
        },
        page: "#F4F7FB",
      },
      fontFamily: {
        sans: ["System"],
        poppins: ["Poppins"],
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};
