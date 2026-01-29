import { createContext, useContext, useState, type ReactNode } from "react";
import {
  THEMES,
  DEFAULT_THEME,
  type ThemeName,
  type ThemeColors,
} from "../config/theme";

interface ThemeContextType {
  theme: ThemeColors;
  themeName: ThemeName;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(DEFAULT_THEME);

  const value: ThemeContextType = {
    theme: THEMES[themeName],
    themeName,
    setTheme: setThemeName,
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
