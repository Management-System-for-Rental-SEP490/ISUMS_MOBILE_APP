import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { AssetCategoryFromApi, AssetItemFromApi } from "./api";

export type AuthStackParamList = {
  AuthLogin: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  ElectricUsage: undefined;
  WaterUsage: undefined;
  Billing: undefined;
  tenants: undefined;
  Profile: undefined;
  Calendar: undefined;
  Notification: undefined;
  /** Tab danh sách ticket dành cho Staff (thay vì Billing) */
  Ticket: undefined;
};
export type HeaderVariant = "default" | "electric" | "water"; // định nghĩa các loại variant của header
export type RootStackParamList = AuthStackParamList & {
  Main: undefined;
  OnBoarding: undefined;
  Camera: undefined;
  DeviceDetail: { device: Device };
  Ticket: { device: Device };
  /** Chi tiết nhà cho Staff: danh sách thiết bị + nút gán NFC. Có thể truyền thêm thông tin từ API houses. */
  BuildingDetail: {
    buildingId: string;
    buildingName: string;
    buildingAddress: string;
    /** Mô tả căn nhà (từ API) */
    description?: string;
    /** Phường (từ API) */
    ward?: string;
    /** Quận (từ API) */
    commune?: string;
    /** Thành phố (từ API) */
    city?: string;
    /** Trạng thái: AVAILABLE, RENTED, ... (từ API) */
    status?: string;
  };
  /** Chi tiết ticket cho Staff: thông tin, trạng thái, nút Nhận ticket (nếu pending) */
  TicketDetail: { ticketId: string };
  /** Màn form tạo danh mục thiết bị (Staff). Không tham số. */
  Category: undefined;
  /** Màn danh sách danh mục thiết bị (Staff). Không tham số. */
  CategoryList: undefined;
  /** Màn chỉnh sửa danh mục (Staff), hiện dạng modal. Param: category cần sửa. */
  CategoryEdit: { category: AssetCategoryFromApi };
  /** Màn danh sách thiết bị (Staff), xếp theo category. */
  ItemList: undefined;
  /** Màn form thêm thiết bị (Staff). */
  ItemCreate: undefined;
  /** Màn chỉnh sửa thiết bị (Staff), hiện dạng modal. Param: item cần sửa. */
  ItemEdit: { item: AssetItemFromApi };
};

export type IconProps = {
  size?: number;
  color?: string;
};
export type LogoProps = {
  width?: number;
  height?: number;
};

export type UserRole = "tenant"| "technical";

export type AuthPayload = {
  username: string;
  role: UserRole;
  token: string;
  idToken?: string; // Thêm idToken để dùng cho logout
  // refreshToken là một chuỗi (string) được sử dụng để lấy lại (làm mới) access token khi access token hết hạn. 
  // Nó giúp người dùng không cần đăng nhập lại mỗi khi phiên làm việc (session) bị timeout.
  refreshToken?: string;
};

export type AuthState = {
  user: string | null;
  role: UserRole | null;
  token: string | null;
  idToken: string | null; // Thêm vào state
  refreshToken: string | null;
  isLoggedIn: boolean;
  onboardedUsers: string[]; // Danh sách username đã xem onboarding
  login: (data: AuthPayload) => void;
  logout: () => void;
  completeOnboarding: () => void; // Hàm xác nhận user hiện tại đã xem xong
};
export type RegisterState = {
  username: string;
  email: string;
  password: string;
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
};
export type ForgotPasswordState = {
  email: string;
  setEmail: (email: string) => void;
  sendEmail: () => void;
};
// chưa sài
export type MenuModalState = {
  visible: boolean;
  open: () => void;
  close: () => void;
};
// quản lý thông tin người dùng trong màn hình profile
export type UserState = {
  name: string;
  email: string;
  password: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
}; 
export type DeviceType = "electric" | "water" | "other";
export type DeviceStatus = "active" | "inactive" | "maintenance" | "pending";
export type Device = {
  id: string;
  name: string;
  type: DeviceType;
  nfcTagId: string;
  location: string;
  status: DeviceStatus;
  metadata?: {
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    installationDate?: string;
  };
};
export interface RentalHouse {
  id: string;
  name: string; // Tên phòng/nhà (VD: Phòng 101, Căn hộ A2)
  address: string;
  contractId: string; // Mã hợp đồng
  contractStatus: 'Active' | 'Expired' | 'Pending';
  startDate: string; // Ngày bắt đầu thuê
  endDate: string; // Ngày kết thúc
}

// Các kiểu dữ liệu liên quan đến API (HouseFromApi, AssetCategoryFromApi, AssetItemFromApi, ...)
// đã được di chuyển sang file riêng `types/api.ts` cho dễ bảo trì.
// Tại đây chỉ re-export lại để ai đang import từ "shared/types" vẫn dùng được.
export type {
  HouseFromApi,
  HousesApiResponse,
  AssetCategoryFromApi,
  AssetCategoriesApiResponse,
  AssetItemFromApi,
  AssetItemsApiResponse,
  UserProfileResponse,
} from "./api";

export type ScanMode = "qr" | "nfc";
export type HomeScreenProps = BottomTabScreenProps<MainTabParamList, "Dashboard">; // HomeScreenProps là một type alias cho BottomTabScreenProps<MainTabParamList, "Dashboard">.
