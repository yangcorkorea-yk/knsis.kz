import type { Config } from "tailwindcss";

/*
 * Token table mirrors docs/prototype/theme.jsx + globals.css :root vars.
 * Keep these in sync — the prototype is the visual SoT.
 *
 * Surface naming flattens the prototype's bg / bgWarm / bgSoft to
 * `paper / warm / ground` so utilities read naturally (`bg-warm` instead
 * of `bg-bg-warm`). Ink subtree folds in body/mute so `text-ink-body`
 * works without an awkward `text-text-mute`.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        warm: "#FBF8F5",
        ground: "#F7F4F0",
        rose: {
          DEFAULT: "#E8607A",
          deep: "#C84365",
          soft: "#FCE7EC",
          tint: "#FDF1F4",
        },
        lavender: {
          DEFAULT: "#B8A4D4",
          soft: "#EFE8F8",
        },
        beige: {
          DEFAULT: "#D4B896",
          soft: "#F5EFE6",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          2: "#3A3A3A",
          body: "#5A5A5A",
          mute: "#8A8A8A",
        },
        line: {
          DEFAULT: "#ECE8E3",
          soft: "#F2EEEA",
        },
        success: "#2F9E6A",
        warn: "#D08A2C",
        danger: "#A04432",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        md: "11px",
        lg: "14px",
        xl: "16px",
        "2xl": "18px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04)",
        cta: "0 4px 14px rgba(232,96,122,0.32)",
        sheet: "0 -8px 24px rgba(0,0,0,0.08)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "system-ui",
          "sans-serif",
        ],
      },
      letterSpacing: {
        display: "-0.04em",
      },
    },
  },
  plugins: [],
};

export default config;
