import { Platform } from "react-native";

// Primary color palette
export const Palette = {
  lima: "#E7F2E4",
  verde: "#80BF41",
  pistacho: "#B1D923",
  naranja: "#F27405",
  blanco: "#F2F2F2",
};

export const Colors = {
  light: {
    // Primary brand colors
    primary: Palette.verde,
    secondary: Palette.pistacho,
    accent: Palette.naranja,

    // Text colors
    text: "#11181C",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",

    // Background colors
    background: Palette.lima,
    backgroundAlt: Palette.blanco,
    surface: "#FFFFFF",

    // Component colors
    border: "#E2E8F0",
    input: Palette.blanco,
    placeholder: "#6B7280",

    // Status colors
    success: Palette.verde,
    warning: Palette.naranja,
    error: "#DC2626",

    // Legacy/compat
    tint: Palette.verde,
    icon: Palette.verde,
    tabIconDefault: "#6B7280",
    tabIconSelected: Palette.verde,
  },
  dark: {
    // Primary brand colors
    primary: Palette.pistacho,
    secondary: Palette.verde,
    accent: Palette.naranja,

    // Text colors
    text: "#ECEDEE",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",

    // Background colors
    background: "#151718",
    backgroundAlt: "#1F2937",
    surface: "#111827",

    // Component colors
    border: "#374151",
    input: "#1F2937",
    placeholder: "#9CA3AF",

    // Status colors
    success: Palette.pistacho,
    warning: Palette.naranja,
    error: "#F87171",

    // Legacy/compat
    tint: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#fff",
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
