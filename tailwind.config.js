/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  safelist: ["grid-cols-5", "grid-cols-6"],
  theme: {
    extend: {
      colors: {
        tile: {
          empty: "#ffffff",
          pending: "#d1d5db",
          absent: "#787c7e",
          present: "#c9b458",
          correct: "#6aaa64",
        },
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-4px)" },
          "40%, 80%": { transform: "translateX(4px)" },
        },
        flip: {
          "0%": { transform: "rotateX(0deg)" },
          "50%": { transform: "rotateX(90deg)" },
          "100%": { transform: "rotateX(0deg)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        flip: "flip 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
};
