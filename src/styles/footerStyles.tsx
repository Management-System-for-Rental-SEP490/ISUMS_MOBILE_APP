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
  // Giải thích từng dòng code cho đoạn styles từ dòng 19-34 dưới đây:
  //
  // iconWrapper: {
  //   padding: 6,                  // Padding bên trong icon (tăng diện tích bấm, giúp icon không bị dính sát mép).
  //   borderRadius: 999,           // Bo tròn toàn bộ khung icon (999 đảm bảo thành hình tròn với mọi kích thước).
  // },
  //
  // iconWrapperActive: {
  //   backgroundColor: "#e0f2fe",  // Khi icon đang active/chọn: đổi nền thành màu xanh nhạt.
  //   shadowColor: "#0f172a",      // Bóng đổ của icon (màu tối xanh đen).
  //   shadowOffset: { width: 0, height: 4 }, // Đổ bóng xuống dưới (dịch y 4px, x 0).
  //   shadowOpacity: 0.1,          // Độ trong suốt bóng đổ (mờ nhẹ, bóng không quá rõ).
  //   shadowRadius: 6,             // Độ tán rộng của bóng đổ.
  //   elevation: 6,                // (Android) Độ nổi khối của icon (giúp bóng hiệu lực trên Android).
  //   transform: [{ scale: 1.05 }],// Phóng to icon một chút khi active (105%), tạo cảm giác nhấn.
  // },
  //
  // iconContainer: {
  //   borderRadius: 999,           // Đảm bảo icon bên trong cũng được bo tròn tối đa.
  // },
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