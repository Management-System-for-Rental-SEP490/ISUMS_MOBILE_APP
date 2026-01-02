import { StyleSheet } from "react-native";

const menuStyles = StyleSheet.create({
  /**
   * backdrop:
   * - Dùng làm nền che mờ phía sau modal.
   * - ...StyleSheet.absoluteFillObject: Trải phủ kín toàn màn hình.
   * - backgroundColor: "rgba(15, 23, 42, 0.45)" để tạo nền đen xanh (midnight) mờ, giúp modal nổi bật và tạo hiệu ứng overlay.
   */
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },

  container: {
    position: "absolute", // đặt menu modal ở vị trí absolute (tuyệt đối) so với parent container (màn hình).
    top: 0, // đặt menu modal ở đầu màn hình.
    bottom: 0, // đặt menu modal ở cuối màn hình.
    right: 0, // đặt menu modal ở bên phải màn hình.
    width: "70%", // đặt menu modal có chiều rộng 70% của màn hình.
    backgroundColor: "#fff", // đặt menu modal có màu trắng.
    borderLeftWidth: 0, // đặt menu modal có viền trái là 0.
    shadowColor: "#0f172a", // đặt menu modal có màu bóng đổ là đen xanh.
    shadowOffset: { width: -4, height: 0 }, // đặt menu modal có độ lệch bóng đổ là -4px ngang, 0px dọc.
    shadowOpacity: 0.1, // đặt menu modal có độ mờ bóng đổ là 0.1.
    shadowRadius: 10, // đặt menu modal có độ bán kính bóng đổ là 10px.
    elevation: 20, // đặt menu modal có độ nổi là 20.
    padding: 24, // đặt menu modal có padding là 24px.
    justifyContent: "center", // đặt menu modal có content ở giữa theo chiều dọc.
    alignItems: "center", // đặt menu modal có content ở giữa theo chiều ngang.
  },
});

export default menuStyles;

