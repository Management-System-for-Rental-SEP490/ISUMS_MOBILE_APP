import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { AssetCategoryFromApi, AssetItemFromApi, FunctionalAreaFromApi } from "./api";

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
  /** Quét QR/NFC cho tenant: tra cứu thiết bị thuộc nhà đang chọn, mở TenantItemDetail. */
  Camera: undefined | { initialScanMode?: "qr" | "nfc" };
  /** Chi tiết thiết bị (tenant): nhận item từ danh sách, fetch theo id, hiển thị giống ItemDescription, có nút Báo cáo sự cố. */
  TenantItemDetail: { item: AssetItemFromApi };
  Ticket: { device: Device };
  /** Chi tiết nhà (tenant): mô tả căn nhà, khu vực chức năng. */
  BuildingDetail: {
    buildingId: string;
    buildingName: string;
    buildingAddress: string;
    /** Mô tả căn nhà (từ API) */
    description?: string;
    /** Phường / xã (`HouseFromApi.ward`) */
    ward?: string;
    /** Quận / huyện (`HouseFromApi.commune`) */
    commune?: string;
    /** Tỉnh / thành phố (`HouseFromApi.city`) */
    city?: string;
    /** Trạng thái: AVAILABLE, RENTED, ... (từ API) */
    status?: string;
    /** Danh sách khu vực chức năng trong nhà (từ API houses.functionalAreas). */
    functionalAreas?: FunctionalAreaFromApi[];
  };
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
  /** ID căn nhà mà user (tenant) đang thuê. */
  houseId?: string;
};

export type AuthState = {
  user: string | null;
  role: UserRole | null;
  token: string | null;
  idToken: string | null; // Thêm vào state
  refreshToken: string | null;
  /** ID căn nhà của tenant (nếu có). */
  houseId: string | null;
  isLoggedIn: boolean;
  onboardedUsers: string[]; // Danh sách username đã xem onboarding
  login: (data: AuthPayload) => void;
  logout: () => void;
  completeOnboarding: () => void; // Hàm xác nhận user hiện tại đã xem xong
  setHouseId: (id: string | null) => void;
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
  ApiResponse,
  HouseFromApi,
  HousesApiResponse,
  FunctionalAreaFromApi,
  AssetCategoryFromApi,
  AssetCategoriesApiResponse,
  AssetItemsParams,
  AssetItemFromApi,
  AssetItemsApiResponse,
  UserProfileResponse,
} from "./api";

export type { TelemetryMessage, UsageData } from "./iot";

export type ScanMode = "qr" | "nfc";
export type HomeScreenProps = BottomTabScreenProps<MainTabParamList, "Dashboard">; // HomeScreenProps là một type alias cho BottomTabScreenProps<MainTabParamList, "Dashboard">.

// Alert Types
export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  type: AlertType;
  show: (title: string, message?: string, buttons?: AlertButton[], type?: AlertType) => void;
  hide: () => void;
}
