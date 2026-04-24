import { useContext } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { SettingsContext } from "@/contexts/settings-context";

/**
 * Returns the active color-scheme ("light" | "dark"), respecting any
 * user override stored in SettingsContext. Falls back to the system
 * setting when the context is not yet mounted or set to "system".
 */
export function useColorScheme(): "light" | "dark" {
  const ctx = useContext(SettingsContext);
  const system = useSystemColorScheme() ?? "light";
  return ctx.settings.theme === "system" ? system : ctx.settings.theme;
}
