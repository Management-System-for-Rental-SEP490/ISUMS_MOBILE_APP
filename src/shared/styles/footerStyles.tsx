//chưa sài
import { StyleSheet } from "react-native";
const footerStyles = StyleSheet.create({
  /**
   * - "footer": dùng cho khung tổng chứa tất cả các icon.
   * - "iconWrapper": dùng cho từng nút-icon, luôn luôn áp dụng.
   * - "iconWrapperActive": chỉ thêm vào iconWrapper nếu icon đó đang active (route hiện tại).
   * - "iconContainer": bọc từng icon để set borderRadius, không ảnh hưởng padding ngoài.
   */
  footer: {
    width: "100%",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 72,
    marginBottom: 9,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  iconWrapper: {
    padding: 6,
    borderRadius: 999,
  },
  iconWrapperActive: {
    backgroundColor: "#e0f2fe",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ scale: 1.05 }],
  },
  iconContainer: {
    borderRadius: 999,
  },
});
export default footerStyles;
