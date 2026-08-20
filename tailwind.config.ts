import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          DEFAULT: "#0F1620", // asphalt / night court background
          surface: "#1B2530",
          raised: "#212C38",
          line: "#2C3844",
        },
        chalk: {
          DEFAULT: "#EAEDF0", // main text, like chalk lines on a court
          muted: "#8996A3",
        },
        grass: {
          DEFAULT: "#3E9A5F", // confirmed / titular
          dim: "#2C7346",
        },
        card: {
          yellow: "#F0B429", // pending / admin actions
          red: "#E0503A", // suplente / urgent
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        floodlight: "0 0 120px 20px rgba(240, 180, 41, 0.08)",
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(234,237,240,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(234,237,240,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
    },
  },
  plugins: [],
};
export default config;
