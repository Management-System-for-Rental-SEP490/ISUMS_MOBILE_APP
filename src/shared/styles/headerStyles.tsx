import { StyleSheet } from "react-native";
// Định nghĩa một object các style sử dụng trong header bằng StyleSheet.create({
const headerStyles = StyleSheet.create({
  gradient: { // Style cho nền gradient phần header
    paddingVertical: 18, // Padding theo chiều dọc (top và bottom) là 18
    paddingHorizontal: 20, // Padding theo chiều ngang (left và right) là 20
    borderBottomLeftRadius: 32, // Bo góc trái phía dưới 32 đơn vị
    borderBottomRightRadius: 32, // Bo góc phải phía dưới 32 đơn vị
  },
  headerRow: { // Style cho View chứa hàng ngang chính của header
    flexDirection: "row", // Các phần tử con xếp thành hàng ngang
    justifyContent: "space-between", // Các phần tử con trải đều, khoảng cách tối đa
    alignItems: "center", // Căn giữa các phần tử con theo chiều dọc
    gap: 10, // Khoảng cách giữa các phần tử con là 10
  },
  brandRow: { // Style cho phần chứa logo và tên thương hiệu
    flexDirection: "row", // Xếp cạnh nhau theo hàng ngang
    alignItems: "center", // Căn giữa các mục theo chiều dọc
  },
  logoWrapper: { // Style cho ô chứa logo bên trái
    width: 48, // Chiều rộng 48
    height: 48, // Chiều cao 48
    borderRadius: 14, // Bo góc 14 (tạo hình tròn/capsule)
    backgroundColor: "rgba(255,255,255,0.3)", // Nền trắng trong suốt 30%
    justifyContent: "center", // Căn giữa nội dung theo chiều dọc
    alignItems: "center", // Căn giữa nội dung theo chiều ngang
    marginRight: 8, // Khoảng cách với phần kế bên phải là 8
  },
  brandTitle: { // Style cho Text tên thương hiệu
    color: "#fff", // Màu chữ trắng
    fontSize: 18, // Cỡ chữ 18
    fontWeight: "700", // Đậm
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "500",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    width: 260,
    marginLeft: 12,
  },
});

export default headerStyles;