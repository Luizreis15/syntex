import type { Config } from "tailwindcss";

/**
 * Nenhum valor de cor, raio, sombra, tipografia ou z-index é definido aqui
 * diretamente — tudo lê de app/globals.css, que por sua vez é a tradução
 * literal de design/SYNTEX-UI.md. Editar aqui sem editar lá é o bug que o
 * teste de conformidade de tokens existe para pegar.
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
      shell: {
        950: "var(--shell-950)",
        900: "var(--shell-900)",
        border: "var(--shell-border)",
        ink: "var(--shell-ink)",
        "ink-2": "var(--shell-ink-2)",
      },
      success: "var(--success)",
      warning: "var(--warning)",
      danger: "var(--danger)",
      info: "var(--info)",
      overlay: "var(--overlay)",
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
    },
    borderRadius: {
      none: "0",
      xs: "var(--r-xs)",
      sm: "var(--r-sm)",
      md: "var(--r-md)",
      full: "9999px",
    },
    boxShadow: {
      none: "none",
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
        shell: "248px",
        "shell-compact": "68px",
        topbar: "58px",
      },
    },
  },
  plugins: [],
};

export default config;
