export const colors = {
  surface: "#FFFFFF",
  onSurface: "#1A1A1A",
  surfaceSecondary: "#F5F5F5",
  onSurfaceSecondary: "#4A4A4A",
  surfaceTertiary: "#EBEBEB",
  surfaceInverse: "#1A1A1A",
  onSurfaceInverse: "#FFFFFF",
  brand: "#DA291C",
  onBrand: "#FFFFFF",
  brandSecondary: "#FEECEB",
  onBrandSecondary: "#DA291C",
  brandTertiary: "#FDDFDC",
  success: "#2E9E4F",
  onSuccess: "#FFFFFF",
  successSoft: "#E6F4EA",
  warning: "#FFCC00",
  error: "#D92D20",
  errorSoft: "#FDE8E6",
  border: "#E5E5EA",
  borderStrong: "#C7C7CC",
  muted: "#8A8A8E",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const font = {
  regular: "Jakarta",
  medium: "JakartaMedium",
  bold: "JakartaBold",
  extra: "JakartaExtraBold",
};

export const statusColor = (status?: string) => {
  switch (status) {
    case "Aktiv":
      return colors.success;
    case "Verletzt":
      return colors.warning;
    case "Inaktiv":
      return colors.muted;
    default:
      return colors.muted;
  }
};
