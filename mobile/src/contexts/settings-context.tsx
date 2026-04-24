import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface Settings {
  /** User-selected theme override. "system" follows the device setting. */
  theme: ThemePreference;
}

export interface SettingsContextValue {
  settings: Settings;
  resolvedTheme: ResolvedTheme;
  updateSettings: (patch: Partial<Settings>) => void;
}

// ─── Defaults / storage ───────────────────────────────────────────────────────

const STORAGE_KEY = "@agenda/settings";

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
};

// ─── Context ──────────────────────────────────────────────────────────────────

export const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  resolvedTheme: "light",
  updateSettings: () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Hydrate from storage on mount; render with defaults in the meantime.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<Settings>;
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      })
      .catch(() => {
        // Silently fall back to defaults.
      });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const resolvedTheme: ResolvedTheme =
    settings.theme === "system"
      ? ((systemColorScheme ?? "light") as ResolvedTheme)
      : settings.theme;

  return (
    <SettingsContext.Provider value={{ settings, resolvedTheme, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSettings() {
  return useContext(SettingsContext);
}
