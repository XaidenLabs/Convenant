import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          deep: "#060E1A",
          mid: "#122038",
        },
        gold: {
          DEFAULT: "#C9A227",
          soft: "#E0C56A",
          dim: "#8A7020",
        },
        mist: "#E8E6E1",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "navy-radial":
          "radial-gradient(ellipse 80% 60% at 50% -10%, #1a3050 0%, #0A1628 55%, #060E1A 100%)",
        "gold-line":
          "linear-gradient(90deg, transparent, #C9A22755, transparent)",
      },
    },
  },
  plugins: [],
};

export default config;
