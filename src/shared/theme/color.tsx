import type { ColorValue } from "react-native";

/** Xanh lá — điểm đầu gradient thương hiệu */
export const BRAND_GREEN = "#3bb582";

/** Xanh biển đặc — điểm cuối gradient (bản không alpha) */
export const BRAND_BLUE = "#2096d8";

/** Điểm cuối gradient dùng cho LinearGradient (có alpha) */
export const BRAND_BLUE_GRADIENT_END = "rgba(32, 150, 216, 0.7)";

/** Nền/viền nhạt từ BRAND_BLUE (icon alert, badge IoT, Home…) */
export const brandBlueMutedBg = "rgba(32, 150, 216, 0.12)";
export const brandBlueMutedBorder = "rgba(32, 150, 216, 0.35)";

/** Cặp màu chuẩn cho `LinearGradient` / `expo-linear-gradient` */
export const brandGradient = [BRAND_GREEN, BRAND_BLUE_GRADIENT_END] as const;

/** Gradient hai màu đặc (khi không dùng bản rgba) */
export const brandGradientSolid: [ColorValue, ColorValue] = [BRAND_GREEN, BRAND_BLUE];

/** Nút, spinner, viền nhấn chính — trùng điểm đầu gradient */
export const brandPrimary = BRAND_GREEN;

/** Icon/link/điểm nhấn phụ — trùng điểm cuối gradient (bản đặc) */
export const brandSecondary = BRAND_BLUE;

/** Nền nhạt gắn thương hiệu (thay các nền xanh dương/cam riêng lẻ) */
export const brandTintBg = "rgba(59, 181, 130, 0.15)";

/** Viền trạng thái active đậm (thay các blue-700 kiểu #1D4ED8) */
export const brandFocusBorder = BRAND_BLUE;

/** Đỏ — đăng xuất, xóa, nút destructive trong alert */
export const BRAND_DANGER = "#DC2626";
export const brandDangerBg = "rgba(254, 226, 226, 0.95)";
export const brandDangerBorder = "rgba(220, 38, 38, 0.4)";
/** Nền chip/ngày active (thay rgba cứng gắn đỏ). */
export const brandDangerMutedBg = "rgba(220, 38, 38, 0.12)";

/**
 * Màu chữ + nền badge/banner thông báo IoT theo `IotAlertLevel`.
 * CRITICAL ≈ Nguy hiểm — đỏ; WARNING — cam đất; HIGH — cam; MEDIUM — vàng đậm; LOW — xanh lá an toàn; INFO — xanh thương hiệu.
 */
const notificationAlertLevelStyles = {
  CRITICAL: { fg: BRAND_DANGER, bg: brandDangerMutedBg },
  WARNING: { fg: "#D97706", bg: "rgba(217, 119, 6, 0.12)" },
  HIGH: { fg: "#EA580C", bg: "rgba(234, 88, 12, 0.12)" },
  MEDIUM: { fg: "#CA8A04", bg: "rgba(202, 138, 4, 0.14)" },
  LOW: { fg: "#059669", bg: "rgba(5, 150, 105, 0.12)" },
  INFO: { fg: BRAND_BLUE, bg: brandBlueMutedBg },
} as const;

export type NotificationAlertLevelKey = keyof typeof notificationAlertLevelStyles;

export function getNotificationAlertLevelStyle(level: string): {
  fg: ColorValue;
  bg: ColorValue;
} {
  const key = String(level ?? "")
    .trim()
    .toUpperCase() as NotificationAlertLevelKey;
  return notificationAlertLevelStyles[key] ?? notificationAlertLevelStyles.INFO;
}

/** Trang tiêu thụ nước: accent & nền nhạt chỉ xanh biển (không dùng xanh lá) */
export const waterAccent = BRAND_BLUE;
export const waterTintBg = "rgba(32, 150, 216, 0.14)";

/** Header màn nước: gradient xanh biển */
export const waterHeaderGradient: [ColorValue, ColorValue] = ["#38bdf8", BRAND_BLUE];

/**
 * Gom token màu một chỗ — đổi palette sau này chỉ cần sửa các hằng phía trên.
 */
export const brandTheme = {
  green: BRAND_GREEN,
  blue: BRAND_BLUE,
  blueGradientEnd: BRAND_BLUE_GRADIENT_END,
  gradient: brandGradient,
  gradientSolid: brandGradientSolid,
  primary: brandPrimary,
  secondary: brandSecondary,
  tintBg: brandTintBg,
  focusBorder: brandFocusBorder,
  danger: BRAND_DANGER,
} as const;

export type BrandTheme = typeof brandTheme;

/**
 * Neutrals dùng chung (thay #111827, #6B7280, #E5E7EB… rải StyleSheet).
 * Giữ đúng giá trị đang dùng trong app để không đổi “cảm giác” UI.
 */
export const neutral = {
  text: "#111827",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textOnDarkSoft: "#cccccc",
  black: "#000000",
  warningBorderLight: "#FCA5A5",
  textBody: "#374151",
  heading: "#1F2937",
  border: "#E5E7EB",
  /** Viền input (gray-300) */
  inputBorder: "#d1d5db",
  surface: "#FFFFFF",
  background: "#F3F4F6",
  backgroundElevated: "#F8FAFC",
  backgroundSubtle: "#F9FAFB",
  slate200: "#e2e8f0",
  slate300: "#CBD5E1",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate600: "#475569",
  slate700: "#334155",
  slate900: "#0f172a",
  borderMuted: "#F1F5F9",
  /** Profile / card nền phụ */
  canvasMuted: "#F5F7FA",
  tileMuted: "#F0F4F8",
  avatarPlaceholder: "#E1E8ED",
  /** Chữ phụ trên nền gradient (onboarding) */
  textMintSoft: "#E0F2F1",
  /** Icon phụ (alert, hàng cài đặt) */
  iconMuted: "#666666",
  /** Nền chip section (work slot / icon wrap) */
  sectionTintIndigo: "#EEF2FF",
  sectionTintMint: "#ECFDF5",
  modalBackdrop: "rgba(15, 23, 42, 0.5)",
} as const;

/** Nền badge trạng thái tài sản (green/blue/red nhạt) */
export const statusBadgeBg = {
  available: "#d1fae5",
  inUse: "#dbeafe",
  disposed: "#fee2e2",
} as const;

/** Badge trạng thái hóa đơn (tenant list / detail) */
export const tenantInvoiceUnpaidBadgeBg = "#FEF3C7";
export const tenantInvoiceUnpaidBadgeFg = "#B45309";
export const tenantInvoicePaidBadgeBg = "#DCFCE7";
export const tenantInvoicePaidBadgeFg = "#15803D";

/** Chữ badge IoT offline (đỏ đậm trên nền nhạt) */
export const iotOfflineLabelColor = "#991B1B";
