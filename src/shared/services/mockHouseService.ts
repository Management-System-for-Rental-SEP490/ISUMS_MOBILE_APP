import { RentalHouse } from "../types";

// Giả lập dữ liệu thông tin ngôi nhà của Tenant
const MOCK_HOUSE: RentalHouse = {
  id: "H001",
  name: "Căn hộ Studio 101",
  address: "123 Đường Nguyễn Văn Linh, Q.7, TP.HCM",
  contractId: "HD-2024-001",
  contractStatus: "Active",
  startDate: "2024-01-01",
  endDate: "2025-01-01",
};

// Hàm lấy thông tin nhà của Tenant đang đăng nhập (giả lập)
// Output: Promise<RentalHouse> - Thông tin chi tiết ngôi nhà
export const getTenantHouseInfo = async (): Promise<RentalHouse> => {
  // Giả lập độ trễ mạng 1 giây để tạo hiệu ứng loading
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_HOUSE), 1000));
};
