/**
 * SmartCropAI Production Mobile Theme & Design System Tokens.
 * Dark Mode Agricultural Palette with high contrast for outdoor field visibility.
 */

export const COLORS = {
  // Brand Colors
  primary: "#16A34A",       // Vivid Agriculture Green
  primaryDark: "#14532D",   // Deep Forest Green
  primaryLight: "#4ADE80",  // Emerald Light
  accent: "#F59E0B",         // Amber Warning / Alert
  accentDark: "#D97706",

  // Feedback Colors
  success: "#22C55E",       // Healthy Leaf Green
  warning: "#EAB308",       // Moderate Infection Yellow
  danger: "#EF4444",        // Severe Disease Red
  info: "#3B82F6",          // System Info Blue

  // Dark Mode Surface Hierarchy
  background: "#0F172A",    // Deep Slate 900
  surface: "#1E293B",       // Card Slate 800
  surfaceElevated: "#334155",// Floating Card Slate 700
  border: "#475569",        // Subtle Border Slate 600

  // Typography Colors
  textPrimary: "#F8FAFC",   // High Contrast White Slate 50
  textSecondary: "#CBD5E1", // Secondary Muted Slate 300
  textMuted: "#94A3B8",     // Subtitle Muted Slate 400
  textDisabled: "#64748B",  // Disabled Text Slate 500
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  huge: 32,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  titleHero: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    color: COLORS.textPrimary,
  },
  titleHeader: {
    fontSize: 22,
    fontWeight: "700" as const,
    lineHeight: 28,
    color: COLORS.textPrimary,
  },
  titleCard: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
    color: COLORS.textPrimary,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    lineHeight: 16,
    color: COLORS.textMuted,
  },
} as const;
