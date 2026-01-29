// Font configuration for Verbalist
// Uses DM Serif Display for headings and Crimson Pro for body text

export const FONT_FAMILIES = {
  // Display font - for logos, headings
  display: "DMSerifDisplay_400Regular",
  
  // Body font - for text, labels, buttons
  bodyLight: "CrimsonPro_300Light",
  body: "CrimsonPro_400Regular",
  bodySemiBold: "CrimsonPro_600SemiBold",
} as const;

// Type scale following the design spec
export const FONT_SIZES = {
  displayLarge: 56,  // Logo
  heading1: 42,      // Screen titles
  heading2: 20,      // Feature titles in messages
  bodyLarge: 18,     // CTA buttons
  body: 16,          // Subtitles, input text
  bodySmall: 14,     // Message descriptions, pill text
  caption: 13,       // Progress text, word count badges
  label: 14,         // Screen numbers
  version: 13,       // Beta tag
} as const;

export const LINE_HEIGHTS = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.5,
} as const;
