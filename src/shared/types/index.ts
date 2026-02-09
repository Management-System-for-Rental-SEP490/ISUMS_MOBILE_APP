import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
export type AuthStackParamList = {
  AuthLogin: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  ElectricUsage: undefined;
  WaterUsage: undefined;
  Billing: undefined;
  Tenants: undefined;
  Profile: undefined;
  Calendar: undefined;
  Notification: undefined;
};
export type HeaderVariant = "default" | "electric" | "water"; // định nghĩa các loại variant của header
export type RootStackParamList = AuthStackParamList & {
  Main: undefined;
  OnBoarding: undefined;
  Camera: undefined;
  DeviceDetail: { device: Device }; // device là một object có kiểu Device
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
export type ScanMode = "qr" | "nfc";
export type HomeScreenProps = BottomTabScreenProps<MainTabParamList, "Dashboard">; // HomeScreenProps là một type alias cho BottomTabScreenProps<MainTabParamList, "Dashboard">.
