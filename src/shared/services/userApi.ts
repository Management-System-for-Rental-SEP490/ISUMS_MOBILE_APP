import axiosClient from "../api/axiosClient";
import { UserProfileResponse } from "../types/api";

// Hàm gọi API lấy thông tin User
export const getUserProfile = async (): Promise<UserProfileResponse> => {
  const response = await axiosClient.get("/users/me"); 
  return response.data;
};

// Hàm update user
export const updateUserProfile = async (data: Partial<UserProfileResponse>): Promise<UserProfileResponse> => {
  const response = await axiosClient.put("/users/me", data);
  return response.data;
};
