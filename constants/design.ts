export const Colors = {
  foamBlue: "#339DC7",
  foamBlueBright: "#3DAFD6",
  foamBlueHover: "#2B85A9",
  foamBlueSubtle: "rgba(51, 157, 199, 0.15)",
  foamDarkTeal: "#0F2F3C",
  foamLightBlue: "#E1F0F7",

  dark: {
    bgPrimary: "#0F2F3C",
    bgSecondary: "#0D3A4A",
    bgElevated: "#164558",
    surface: "#1C5268",
    borderSubtle: "#1E5D72",
    borderDefault: "#2B7A96",
    textPrimary: "#F5F5F5",
    textSecondary: "#A3C4CF",
    textTertiary: "#6A9BAA",
    textDisabled: "#3D6B7A",
  },

  light: {
    bgPrimary: "#FAFAFA",
    bgSecondary: "#F4F4F5",
    bgElevated: "#FFFFFF",
    surface: "#FFFFFF",
    borderSubtle: "#E4E4E7",
    borderDefault: "#D4D4D8",
    textPrimary: "#0A0A0A",
    textSecondary: "#525252",
    textTertiary: "#A3A3A3",
    textDisabled: "#D4D4D4",
  },

  success: "#22C55E",
  successLight: "#16A34A",
  warning: "#F59E0B",
  warningLight: "#D97706",
  error: "#EF4444",
  errorLight: "#DC2626",
  rainCoverage: "#E1F0F7",

  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",
} as const;

export const Typography = {
  display: "PlayfairDisplay_700Bold",
  displayExtraBold: "PlayfairDisplay_800ExtraBold_Italic",
  body: "Inter_400Regular",
  bodyMedium: "Inter_500Medium",
  bodySemiBold: "Inter_600SemiBold",

  size: {
    display: 40,
    h1: 32,
    h2: 24,
    h3: 20,
    h4: 18,
    bodyL: 16,
    bodyM: 14,
    bodyS: 13,
    caption: 12,
    label: 11,
  },

  lineHeight: {
    display: 48,
    h1: 38,
    h2: 29,
    h3: 24,
    h4: 22,
    bodyL: 24,
    bodyM: 21,
    bodyS: 20,
    caption: 18,
    label: 16,
  },

  tracking: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    label: 0.8,
  },
} as const;

export const Spacing = {
  micro: 2,
  xs: 4,
  sm: 8,
  mdSm: 12,
  md: 16,
  mdLg: 20,
  lg: 24,
  xl: 32,
  xl2: 40,
  xl3: 48,
  xl4: 64,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 9999,
} as const;

export const Shadows = {
  dark: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.6,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  light: {
    sm: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 4,
    },
    lg: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  },
} as const;

export const Animation = {
  micro: 150,
  standard: 200,
  modal: 280,
  screen: 300,
  onboarding: 400,
} as const;
