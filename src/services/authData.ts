import { AuthPayload, UserRole } from "../types";

type MockUser = {
  username: string;
  password: string;
  role: UserRole;
};

const mockUsers: MockUser[] = [
  { username: "tenant", password: "tenant123", role: "tenant" },
  { username: "landlord", password: "landlord123", role: "landlord" },
  { username: "admin", password: "admin123", role: "admin" },
];
/*
Dòng 15-17 trong file này:

const createToken = (username: string) => `mock-token-${username}-${Date.now()}`;
const createRefreshToken = (username: string) =>
  `mock-refresh-${username}-${Math.floor(Math.random() * 1e6)}`;

có chức năng tạo ra "token" và "refreshToken" giả lập (mock) cho quá trình đăng nhập. 
- createToken sinh ra một chuỗi token mô phỏng dựa trên username và thời gian hiện tại (Date.now() tạo ra số mili giây).
- createRefreshToken sinh ra chuỗi refreshToken mô phỏng, có thêm đoạn số random từ 0 đến gần 1 triệu.

Hai hàm này dùng để giả lập việc nhận token và refreshToken từ server khi đăng nhập thành công, giúp quá trình phát triển, test chức năng đăng nhập mà không cần backend thực.
*/

const createToken = (username: string) => `mock-token-${username}-${Date.now()}`;
const createRefreshToken = (username: string) =>
  `mock-refresh-${username}-${Math.floor(Math.random() * 1e6)}`;

export const mockLogin = async (username: string, password: string): Promise<AuthPayload> => {
  const user = mockUsers.find((item) => item.username === username && item.password === password);

  if (!user) {
    return Promise.reject(new Error("Thông tin đăng nhập không đúng. Vui lòng thử lại."));
  }

  return Promise.resolve({
    username: user.username,
    role: user.role,
    token: createToken(user.username),
    refreshToken: createRefreshToken(user.username),
  });
};

