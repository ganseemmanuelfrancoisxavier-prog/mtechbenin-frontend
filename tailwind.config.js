/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Palette principale ───────────────────────────────────────────
        primary: "#1D1D1F", // Noir Apple
        cta: "#E30613", // Rouge — badges promo UNIQUEMENT
        dark: "#0F0F0F", // Noir profond

        // ── Palette Apple ────────────────────────────────────────────────
        "apple-black": "#1D1D1F",
        "apple-gray": "#F5F5F7",
        "apple-mid": "#6E6E73",
        "apple-light": "#FBFBFD",

        // ── Neutres ──────────────────────────────────────────────────────
        "neutral-100": "#F5F5F7",
        "neutral-200": "#E8E8ED",
        "neutral-300": "#D1D1D6",
        "neutral-400": "#AEAEB2",
        "neutral-500": "#8E8E93",
        "neutral-600": "#636366",
        "neutral-700": "#48484A",
        "neutral-800": "#3A3A3C",
        "neutral-900": "#1C1C1E",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        display: ["Plus Jakarta Sans", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "40px",
      },
      boxShadow: {
        // Glassmorphism
        "glass-sm":
          "0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.6)",
        glass:
          "0 4px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.5)",
        "glass-lg":
          "0 8px 40px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.4)",
        "glass-xl":
          "0 16px 64px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.3)",
        // Premium
        "premium-sm": "0 2px 12px rgba(0,0,0,0.06)",
        premium: "0 4px 32px rgba(0,0,0,0.08)",
        "premium-lg": "0 8px 48px rgba(0,0,0,0.12)",
        "premium-xl": "0 16px 72px rgba(0,0,0,0.16)",
        // Rouge — badges uniquement
        "red-sm": "0 2px 8px rgba(227,6,19,0.15)",
        "red-md": "0 4px 16px rgba(227,6,19,0.20)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.5s cubic-bezier(0.16,1,0.3,1)",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16,1,0.3,1)",
        "blur-in": "blurIn 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blurIn: {
          "0%": { opacity: "0", filter: "blur(8px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
      },
      transitionTimingFunction: {
        apple: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
