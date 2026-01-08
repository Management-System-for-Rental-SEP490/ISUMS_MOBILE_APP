
export type AuthStackParamList = {
  AuthLogin: undefined;
  AuthRegister: { username: string; email: string; password: string };
  AuthForgotPassword: { email: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  ElectricUsage: undefined;
  WaterUsage: undefined;
  Billing: undefined;
  Tenants: undefined;
  Profile: undefined;
};

export type RootStackParamList = AuthStackParamList & {
  Main: undefined;
};

export type IconProps = {
  size?: number;
  color?: string;
};

export type UserRole = "tenant" | "landlord" | "admin";

export type AuthPayload = {
  username: string;
  role: UserRole;
  token: string;
  // refreshToken là một chuỗi (string) được sử dụng để lấy lại (làm mới) access token khi access token hết hạn. 
  // Nó giúp người dùng không cần đăng nhập lại mỗi khi phiên làm việc (session) bị timeout.
  refreshToken?: string;
};

export type AuthState = {
  user: string | null;
  role: UserRole | null;
  token: string | null;
  refreshToken: string | null;
  isLoggedIn: boolean;
  login: (data: AuthPayload) => void;
  logout: () => void;
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