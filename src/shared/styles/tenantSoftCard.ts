import type { ViewStyle } from "react-native";
import { neutral } from "../theme/color";

/**
 * Card trắng mềm — đồng bộ Home, Thông báo, Tiêu thụ, chi tiết cảnh báo IoT.
 * (Cùng logic với `homeStyles` SOFT_CARD trước đây; gom một nơi để tránh lệch.)
 */
export const tenantSoftCard: ViewStyle = {
  backgroundColor: neutral.surface,
  borderRadius: 20,
  borderWidth: 1,
  borderColor: "rgba(0,0,0,0.04)",
  shadowColor: neutral.black,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 16,
  elevation: 4,
};
