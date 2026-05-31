/**
 * API lịch làm việc (schedule) dùng cho tenant hiển thị thời gian dự kiến xử lý.
 */
import axiosClient from "../api/axiosClient";
import { BACKEND_API_BASE } from "../api/config";
import type { WorkSlotByIdApiResponse, WorkSlotsApiResponse } from "../types/api";

/**
 * Lấy danh sách work slots (các ca làm việc đã đặt) của staff.
 *
 * Endpoint: GET /api/schedules/work_slots/staff/{staffId}
 */
export const getWorkSlotsByStaffId = async (
  staffId: string,
): Promise<WorkSlotsApiResponse> => {
  const id = staffId?.trim();
  if (!id) {
    return { data: [], message: "", statusCode: 400, success: false };
  }

  const url = `${BACKEND_API_BASE}/schedules/work_slots/staff/${encodeURIComponent(id)}`;
  //const url = `${BACKEND_API_BASE}/schedules/work_slots/staff/${encodeURIComponent(id)}`;
  const response = await axiosClient.get<WorkSlotsApiResponse>(url);
  return response.data;
};

/**
 * Lấy 1 work slot theo id.
 * Endpoint: GET /api/schedules/work_slots/{slotId}
 */
export const getWorkSlotById = async (
  slotId: string,
): Promise<WorkSlotByIdApiResponse> => {
  const id = slotId?.trim();
  if (!id) {
    return { data: null as any, message: "", statusCode: 400, success: false };
  }

  const url = `${BACKEND_API_BASE}/schedules/work_slots/${encodeURIComponent(id)}`;
  //const url = `${BACKEND_API_BASE}/schedules/work_slots/${encodeURIComponent(id)}`;
  const response = await axiosClient.get<WorkSlotByIdApiResponse>(url);
  return response.data;
};

