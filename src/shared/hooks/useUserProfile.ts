import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserProfile,
  updateMainHouse,
  updateUserLanguage,
  updateUserProfile,
} from "../services/userApi";
import type { AppLocaleCode } from "../utils/resolveLocalizedJsonString";
import { UserProfileResponse } from "../types/api";
import { useAuthStore } from "../../store/useAuthStore";

// Query Key
export const USER_KEYS = {
  all: ["user"] as const,
  profile: () => [...USER_KEYS.all, "profile"] as const,
};

// Hook lấy thông tin user
export const useUserProfile = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: USER_KEYS.profile(),
    queryFn: getUserProfile,
    enabled: Boolean(token),
  });
};

// Hook cập nhật thông tin user
export const useUpdateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserProfile, 
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.profile() });
      console.log("Update profile success!");
    },
    onError: (error) => {
      console.error("Update profile failed:", error);
    },
  });
};

/** Hook cập nhật ngôn ngữ user hiện tại. */
export const useUpdateUserLanguageMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: AppLocaleCode) => updateUserLanguage({ language }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.profile() });
    },
  });
};

/** Hook cập nhật nhà chính tenant. */
export const useUpdateMainHouseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateMainHouse,
    onSuccess: (_data, variables) => {
      useAuthStore.getState().setHouseId(variables.houseId);
      queryClient.invalidateQueries({ queryKey: ["houses", "tenant"] });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.profile() });
    },
  });
};
