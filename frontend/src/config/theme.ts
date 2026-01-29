// Centralized theme configuration
// Three themes: lapis (default), obsidian (dark), porcelain (warm)

export type ThemeName = "lapis" | "obsidian" | "porcelain";

export interface ThemeColors {
  // Base colors
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;

  // Brand/Accent colors
  accent: string;
  accentSecondary: string;
  accentTertiary: string;

  // Chat colors
  bubbleUser: string;
  bubbleUserText: string;
  bubbleAssistant: string;
  bubbleAssistantText: string;
  bubbleBorder: string;

  // UI elements
  border: string;
  divider: string;
  inputBackground: string;
  cardBackground: string;

  // Button
  buttonBackground: string;
  buttonText: string;

  // Status colors
  success: string;
  warning: string;
  error: string;
}

// Lapis Theme - Welcome Screen (Default)
// Elegant cream and blue palette
const lapis: ThemeColors = {
  // Base - Creamy warm backgrounds
  background: "#F6F3E7",      // Rapture's Light
  surface: "#FAEBD7",         // Milk Tooth
  surfaceAlt: "#FFFFFF",      // White for message bubbles
  text: "#0F1939",            // Cosmic Odyssey
  textSecondary: "#26428B",   // Blue Oblivion
  textMuted: "#516AC8",       // Sapphire Dust

  // Brand/Accent
  accent: "#E3AF64",          // Caramel Essence
  accentSecondary: "#516AC8", // Sapphire Dust
  accentTertiary: "#26428B",  // Blue Oblivion

  // Chat
  bubbleUser: "#26428B",
  bubbleUserText: "#FFFFFF",
  bubbleAssistant: "#FFFFFF",
  bubbleAssistantText: "#0F1939",
  bubbleBorder: "#E3AF64",    // Caramel left border

  // UI
  border: "#E3AF64",
  divider: "#FAEBD7",
  inputBackground: "#FFFFFF",
  cardBackground: "#FFFFFF",

  // Button
  buttonBackground: "#26428B", // Blue Oblivion
  buttonText: "#FFFFFF",

  // Status
  success: "#10B981",
  warning: "#E3AF64",
  error: "#EF4444",
};

// Obsidian Theme - Word List Selection (Dark)
// Deep purple and pink accents
const obsidian: ThemeColors = {
  // Base - Dark backgrounds
  background: "#202030",      // Black Howl
  surface: "rgba(255, 255, 255, 0.05)",
  surfaceAlt: "#4C1050",      // Shani Purple
  text: "#E3E3DC",            // Snow Drift
  textSecondary: "#BEBEC4",   // Moonwalk
  textMuted: "#BEBEC4",       // Moonwalk

  // Brand/Accent
  accent: "#F392A0",          // Cherry Foam
  accentSecondary: "#3D34A5", // Purple Cabbage
  accentTertiary: "#4C1050",  // Shani Purple

  // Chat
  bubbleUser: "#4C1050",
  bubbleUserText: "#E3E3DC",
  bubbleAssistant: "rgba(255, 255, 255, 0.05)",
  bubbleAssistantText: "#E3E3DC",
  bubbleBorder: "#F392A0",

  // UI
  border: "rgba(227, 227, 220, 0.1)",
  divider: "rgba(227, 227, 220, 0.1)",
  inputBackground: "rgba(255, 255, 255, 0.05)",
  cardBackground: "rgba(255, 255, 255, 0.05)",

  // Button
  buttonBackground: "#F392A0",
  buttonText: "#202030",

  // Status
  success: "#22C55E",
  warning: "#FBBF24",
  error: "#F87171",
};

// Porcelain Theme - Custom Word List (Warm)
// Soft neutrals with green accents
const porcelain: ThemeColors = {
  // Base - Warm whites
  background: "#FBFAF5",      // Unbleached
  surface: "#EBDFD8",         // Cameo Stone
  surfaceAlt: "#FEEEA5",      // Cream and Butter
  text: "#18453B",            // MSU Green
  textSecondary: "#6C6D2F",   // Safari Green
  textMuted: "#6C6D2F",       // Safari Green (40% opacity in use)

  // Brand/Accent
  accent: "#BCBDE4",          // Pretty Posie
  accentSecondary: "#FEEEA5", // Cream and Butter
  accentTertiary: "#6C6D2F",  // Safari Green

  // Chat
  bubbleUser: "#6C6D2F",
  bubbleUserText: "#FFFFFF",
  bubbleAssistant: "#FFFFFF",
  bubbleAssistantText: "#18453B",
  bubbleBorder: "#BCBDE4",

  // UI
  border: "#EBDFD8",
  divider: "#EBDFD8",
  inputBackground: "#FFFFFF",
  cardBackground: "#FFFFFF",

  // Button
  buttonBackground: "#6C6D2F", // Safari Green
  buttonText: "#FFFFFF",

  // Status
  success: "#6C6D2F",
  warning: "#FEEEA5",
  error: "#DC2626",
};

export const THEMES: Record<ThemeName, ThemeColors> = {
  lapis,
  obsidian,
  porcelain,
};

export const DEFAULT_THEME: ThemeName = "lapis";
