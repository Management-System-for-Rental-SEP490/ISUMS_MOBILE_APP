import axiosClient from "../api/axiosClient";

// Định nghĩa kiểu dữ liệu trả về từ API (User Profile)
// Bạn nên move cái này sang src/shared/types/index.ts nếu muốn dùng chung
export interface UserProfileResponse {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  // ... các trường khác trả về từ Backend
}

// Hàm gọi API lấy thông tin User
// Hàm này trả về Promise, sẽ được React Query sử dụng
export const getUserProfile = async (): Promise<UserProfileResponse> => {
  // axiosClient đã tự động gắn Token và xử lý Refresh Token
  // Bạn chỉ cần quan tâm đến đường dẫn API
  const response = await axiosClient.get("/users/me"); 
  return response.data;
};

// Ví dụ hàm update user (dùng cho Mutation)
export const updateUserProfile = async (data: Partial<UserProfileResponse>): Promise<UserProfileResponse> => {
  const response = await axiosClient.put("/users/me", data);
  return response.data;
};
