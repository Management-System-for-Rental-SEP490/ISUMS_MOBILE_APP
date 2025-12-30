
export type RootStackParamList = {
  AuthLogin: undefined;
  Home: { username?: string };
  User: undefined;
  Electric: undefined;
  Water: undefined;
  AuthRegister: { username: string, email: string, password: string };
  AuthForgotPassword: { email: string };
};
export type IconProps = {
  size?: number;
  color?: string;
};
export type AuthState = {
  user: string | null;
  isLoggedIn: boolean;
  login: (username: string) => void;
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

// quản lý thông tin người dùng trong màn hình profile
export type UserState = {
  name: string;
  email: string;
  password: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
}; 