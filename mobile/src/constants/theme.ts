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
    // Primary brand colors (brightened for contrast on dark backgrounds)
    primary: "#B1D923", // Brighter pistacho for better visibility
    secondary: "#A3D975", // Brightened verde for balance
    accent: "#FFA500", // Lighter naranja for better contrast

    // Text colors (light palette for dark backgrounds)
    text: "#F3F4F6", // Bright off-white
    textSecondary: "#D1D5DB", // Light gray
    textMuted: "#9CA3AF", // Medium gray

    // Background colors (dark palette)
    background: "#0F1419", // Very dark charcoal
    backgroundAlt: "#1A1E27", // Dark blue-gray
    surface: "#242B36", // Slightly lighter blue-gray for cards/containers

    // Component colors (optimized for dark mode)
    border: "#3F4651", // Dark gray borders
    input: "#1A1E27", // Dark input background
    placeholder: "#9CA3AF", // Medium gray placeholder

    // Status colors (brightened for visibility)
    success: "#86EFAC", // Bright green for success states
    warning: "#FBBF24", // Bright amber for warnings
    error: "#FCA5A5", // Bright red for errors

    // Legacy/compat
    tint: "#B1D923", // Pistacho for consistency
    icon: "#B1D923", // Match primary
    tabIconDefault: "#9CA3AF", // Muted gray
    tabIconSelected: "#B1D923", // Active pistacho
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
