import { useContext } from "react";
import { SettingsContext } from "@/contexts/settings-context";

/**
 * Returns the active color-scheme ("light" | "dark") from the user's
 * saved preference. Defaults to "dark" when no preference is stored.
 */
export function useColorScheme(): "light" | "dark" {
  const ctx = useContext(SettingsContext);
  return ctx.settings.theme;
}
