import { create } from "zustand";
import { AuthState, ForgotPasswordState, RegisterState } from "../types";

/*
Giải thích logic, ý nghĩa từng syntax trong hàm useAuthStore và cơ chế zustand hoạt động (so với useState):

1. `const useAuthStore = create<AuthState>((set) => ({ ... }))`
   - `create` là hàm của thư viện Zustand, dùng để tạo một custom hook cho state management (quản lý trạng thái toàn cục).
   - Cú pháp generic `<AuthState>` như sau báo với TypeScript rằng kiểu dữ liệu state lưu trong store sẽ tuân thủ interface/type AuthState.
   - Hàm callback `(set) => ({ ... })` nhận vào một hàm set (tương tự setState trong useState) và trả về object chứa các thuộc tính (user, isLoggedIn, ...) đại diện “state” ban đầu và các hàm thay đổi state (actions).

2. Bên trong object khởi tạo:
   - `user: null,` và `isLoggedIn: false,` là giá trị khởi tạo trạng thái. 
   - `login: (username: string) => set({ user: username, isLoggedIn: true })` 
        - Đây là một action (hàm thay đổi state): khi gọi `login`, trạng thái trong store sẽ được cập nhật (user = username, isLoggedIn = true) bằng cách gọi `set`.
   - `logout: () => set({ user: null, isLoggedIn: false })`
        - Ngược lại, hàm logout sẽ reset lại user về null và isLoggedIn thành false.

3. Cách dùng và cơ chế hoạt động:
   - Khi bạn gọi `useAuthStore()` trong bất kỳ component nào, Zustand sẽ cung cấp state hiện tại (user/isLoggedIn) và các hàm login, logout.
   - Bất kỳ component nào dùng hook này sẽ tự động nhận update khi state thay đổi.
   - Không như `useState` hay `useReducer` của React chỉ quản lý state trong 1 component, Zustand tạo ra một global store ở ngoài React tree, nhờ đó bạn có thể lấy/truy cập state/dispatch actions ở bất kỳ đâu mà không cần truyền props hoặc dùng context phức tạp.
   - Cơ chế này đơn giản nhưng mạnh mẽ, state “shared” giữa các màn hình, trang, component một cách tối ưu.

Tóm lại:
- Zustand quản lý trạng thái tập trung bằng một store toàn cục.
- useAuthStore cho phép mọi component truy cập và chỉnh sửa trạng thái đăng nhập, login/logout tiện lợi và nhất quán, không cần props drilling.
- Cú pháp object return trong create giúp khai báo state ban đầu và các “thao tác” với state ngay tại chỗ.
*/

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  login: (username: string) => set({ user: username, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false }),
}));
const useRegisterStore = create<RegisterState>((set) => ({
  username: "",
  email: "",
  password: "",
  setUsername: (username: string) => set({ username }),
  setEmail: (email: string) => set({ email }),
  setPassword: (password: string) => set({ password }),
}));
const useForgotPasswordStore = create<ForgotPasswordState>((set) => ({
  email: "",
  setEmail: (email: string) => set({ email }),
  sendEmail: () => set({ email: "" }),
}));

export { useAuthStore, useRegisterStore, useForgotPasswordStore};
