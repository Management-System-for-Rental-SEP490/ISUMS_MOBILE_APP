// Cấu hình chung cho Backend API (base URL).
// Mục đích: chỉ khai báo 1 lần rồi dùng lại ở các service (houses, asset,...)
// để sau này nếu đổi domain/ngrok chỉ cần sửa ở đây.

/**
 * Base URL của Backend API cho toàn bộ phần houses / asset / ticket...
 *
 * - Ưu tiên đọc từ biến môi trường `EXPO_PUBLIC_HOUSES_API_BASE`
 *   để cấu hình linh hoạt giữa dev / staging / production.
 * - Nếu không có biến môi trường, tạm dùng fallback là URL ngrok hiện tại.
 */
export const BACKEND_API_BASE =
  typeof process !== "undefined" && process.env?.EXPO_PUBLIC_HOUSES_API_BASE
    ? process.env.EXPO_PUBLIC_HOUSES_API_BASE
    : "https://unrestrictable-lan-syzygial.ngrok-free.dev/api";

