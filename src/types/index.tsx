
export type RootStackParamList = {
  Login: undefined;
  Home: { username?: string };
  User: undefined;
  Electric: undefined;
  Water: undefined;
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