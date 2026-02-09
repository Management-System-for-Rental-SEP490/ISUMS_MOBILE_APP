// Định nghĩa các kiểu dữ liệu trả về từ Backend API

// Kiểu dữ liệu User Profile
export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  // Thêm các trường khác tùy theo response thực tế từ BE
}

// Sau này có thêm API khác thì định nghĩa tiếp ở dưới
// export interface DeviceResponse { ... }
