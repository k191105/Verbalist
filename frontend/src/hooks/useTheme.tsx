import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  THEMES,
  DEFAULT_THEME,
  resolveThemeColors,
  type ThemeName,
  type ThemeColors,
} from "../config/theme";

const THEME_STORAGE_KEY = "@verbalist_theme";

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const [themeName, setThemeNameState] = useState<ThemeName>(DEFAULT_THEME);

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored && ["lapis", "obsidian", "porcelain", "system"].includes(stored)) {
        setThemeNameState(stored as ThemeName);
      }
    });
  }, []);

  const setTheme = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    AsyncStorage.setItem(THEME_STORAGE_KEY, name);
  }, []);

  const theme = resolveThemeColors(themeName, colorScheme ?? null);

  const value: ThemeContextType = {
    theme,
    themeName,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Re-export for convenience
export { THEMES, DEFAULT_THEME, type ThemeName, type ThemeColors };
