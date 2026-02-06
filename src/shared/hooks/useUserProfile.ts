import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, updateUserProfile, UserProfileResponse } from "../services/userService";

// Query Key: Định danh duy nhất cho loại dữ liệu này trong Cache
// Khi muốn làm mới dữ liệu từ nơi khác, ta sẽ dùng key này
export const USER_KEYS = {
  all: ["user"] as const,
  profile: () => [...USER_KEYS.all, "profile"] as const,
};

// Hook lấy thông tin user
export const useUserProfile = () => {
  return useQuery({
    queryKey: USER_KEYS.profile(), // Key định danh: ["user", "profile"]
    queryFn: getUserProfile,       // Hàm gọi API thực tế
    
    // Các tùy chọn thêm (Optional):
    // staleTime: 5 * 60 * 1000, // Dữ liệu coi là cũ sau 5 phút (mặc định set ở App.tsx rồi)
    // enabled: !!token,         // Chỉ chạy khi có token (nhưng axiosClient lo rồi nên kệ)
    // onError: (error) => console.log(error),
  });
};

// Hook cập nhật thông tin user
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile, // Hàm gọi API update
    
    // Khi update thành công
    onSuccess: (data) => {
      // 1. Cập nhật ngay lập tức dữ liệu trong cache (Optimistic UI update - Optional)
      // queryClient.setQueryData(USER_KEYS.profile(), data);

      // 2. Hoặc đơn giản là đánh dấu dữ liệu cũ là "bẩn" (stale) để React Query tự fetch lại
      queryClient.invalidateQueries({ queryKey: USER_KEYS.profile() });
      
      console.log("Update profile success!");
    },
    onError: (error) => {
      console.error("Update profile failed:", error);
    },
  });
};
