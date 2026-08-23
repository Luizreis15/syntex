import type { Config } from "tailwindcss";

/**
 * Tokens via CSS vars em app/globals.css ← design/SYNTEX-UI.md (v2.1).
 * Não defina cor/raio/sombra/tipo aqui sem espelhar no doc e no CSS.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      paper: "var(--paper)",
      surface: {
        DEFAULT: "var(--surface)",
        2: "var(--surface-2)",
      },
      border: {
        DEFAULT: "var(--border)",
        strong: "var(--border-strong)",
      },
      ink: {
        DEFAULT: "var(--ink)",
        2: "var(--ink-2)",
        3: "var(--ink-3)",
      },
      petrol: {
        900: "var(--petrol-900)",
        800: "var(--petrol-800)",
        700: "var(--petrol-700)",
        600: "var(--petrol-600)",
        100: "var(--petrol-100)",
      },
      teal: "var(--teal)",
      shell: {
        950: "var(--shell-950)",
        900: "var(--shell-900)",
        border: "var(--shell-border)",
        ink: "var(--shell-ink)",
        "ink-2": "var(--shell-ink-2)",
        active: "var(--shell-active)",
      },
      success: "var(--success)",
      warning: "var(--warning)",
      danger: "var(--danger)",
      info: "var(--info)",
      overlay: "var(--overlay)",
      tint: {
        teal: "var(--tint-teal)",
        blue: "var(--tint-blue)",
        green: "var(--tint-green)",
        amber: "var(--tint-amber)",
        red: "var(--tint-red)",
      },
      rail: {
        teal: "var(--rail-teal)",
        blue: "var(--rail-blue)",
        green: "var(--rail-green)",
        amber: "var(--rail-amber)",
        red: "var(--rail-red)",
      },
      track: {
        DEFAULT: "var(--track)",
        dark: "var(--track-dark)",
      },
      status: {
        reconhecida: "var(--st-reconhecida)",
        "reconhecida-bg": "var(--st-reconhecida-bg)",
        reivindicada: "var(--st-reivindicada)",
        "reivindicada-bg": "var(--st-reivindicada-bg)",
        disputada: "var(--st-disputada)",
        "disputada-bg": "var(--st-disputada-bg)",
        perdida: "var(--st-perdida)",
        "perdida-bg": "var(--st-perdida-bg)",
        sensivel: "var(--st-sensivel)",
        "sensivel-bg": "var(--st-sensivel-bg)",
      },
    },
    fontFamily: {
      sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
    },
    fontSize: {
      "page-title": ["var(--text-page-title)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
      section: ["var(--text-section)", { lineHeight: "1.3" }],
      component: ["var(--text-component)", { lineHeight: "1.35" }],
      body: ["var(--text-body)", { lineHeight: "1.45" }],
      dense: ["var(--text-dense)", { lineHeight: "1.4" }],
      label: ["var(--text-label)", { lineHeight: "1.3", letterSpacing: "0.055em" }],
      metric: ["var(--text-metric)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
      "metric-sm": ["var(--text-metric-sm)", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
    },
    borderRadius: {
      none: "0",
      xs: "var(--r-xs)",
      sm: "var(--r-sm)",
      md: "var(--r-md)",
      lg: "var(--r-lg)",
      control: "var(--r-control)",
      panel: "var(--r-panel)",
      feature: "var(--r-feature)",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
      surface: "var(--shadow-surface)",
      raised: "var(--shadow-raised)",
      overlay: "var(--shadow-overlay)",
      /* Compat v2 */
      sm: "var(--shadow-sm)",
      elevated: "var(--shadow-elevated)",
    },
    zIndex: {
      base: "var(--z-base)",
      sticky: "var(--z-sticky)",
      dropdown: "var(--z-dropdown)",
      popover: "var(--z-popover)",
      drawer: "var(--z-drawer)",
      modal: "var(--z-modal)",
      command: "var(--z-command)",
      toast: "var(--z-toast)",
    },
    extend: {
      height: {
        row: "var(--row-h)",
        input: "var(--input-h)",
      },
      minHeight: {
        row: "var(--row-h)",
        input: "var(--input-h)",
      },
      spacing: {
        shell: "240px",
        "shell-compact": "68px",
        topbar: "64px",
      },
    },
  },
  plugins: [],
};

export default config;
