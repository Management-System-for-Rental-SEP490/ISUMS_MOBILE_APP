// Định nghĩa các kiểu dữ liệu trả về từ Backend API.
// Mục tiêu: gom TẤT CẢ các kiểu liên quan đến response API vào một nơi
// để dễ bảo trì, tìm kiếm và tái sử dụng.

// =========================================================
// Response wrapper chung (User API / các BE cùng format Swagger)
// =========================================================

/** Wrapper chuẩn response từ BE (statusCode, success, message, errors, data). Dùng cho GET /api/users/me và các API cùng format. */
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  errors: Array<{
    code: string;
    field: string;
    message: string;
  }>;
  data: T;
}

// =========================================================
// User API
// =========================================================

/** Kiểu dữ liệu user profile trả về từ API (ví dụ: GET /api/users/me). */
export interface UserProfileResponse {
  /** ID duy nhất của user trong hệ thống. */
  id: string;
  /** Tên hiển thị. */
  name: string;
  /** Email của user. */
  email: string;
  /** Số CMND/CCCD. */
  identityNumber: string;
  /** Số điện thoại. */
  phoneNumber: string;
  /** Danh sách roles (VD: ["TENANT", "ADMIN"]). */
  roles: string[];
  /** Nhà chính trên BE (GET /api/users/me). `null`/thiếu → tenant chưa gán; app gọi PUT /api/users/main-house. */
  mainHouseId?: string | null;
}

// =========================================================
// E-contracts — tenant (GET /api/econtracts/my)
// =========================================================

/** Một hợp đồng điện tử mà tenant là bên thuê; response không có HTML/snapshotKey. */
export interface TenantEContractFromApi {
  id: string;
  name: string;
  houseId: string;
  startAt: string;
  endAt: string;
  status: string;
  /** Có giá trị khi status thuộc PENDING_TENANT_REVIEW | READY | IN_PROGRESS | COMPLETED. */
  pdfUrl?: string | null;
  createdAt: string;
}

// =========================================================
// Payments — VNPay (POST /api/payments/vnpay)
// =========================================================

/**
 * Body tạo link thanh toán VNPay (tenant đã đăng nhập).
 * Chỉ một luồng: hoặc `invoiceIds` (tiền nhà/cọc), hoặc `quoteId` (báo giá sửa chữa — ticket `WAITING_PAYMENT`), không gửi cả hai.
 */
export type VnpayPaymentCreateRequest =
  | {
      invoiceIds: string[];
      bankCode?: string;
      locale: string;
    }
  | {
      quoteId: string;
      bankCode?: string;
      locale: string;
    };

/** BE trả URL đầy đủ tới cổng VNPay trong `data` (chuỗi). */
export type VnpayPaymentLinkApiResponse = ApiResponse<string>;

/**
 * GET /api/payments/vnpay/return — BE đọc query VNPay, kiểm tra `vnp_SecureHash`, trả `message`/`data` đáng tin.
 */
export type VnpayReturnValidationApiResponse = ApiResponse<string>;

// =========================================================
// Houses API (/api/houses)
// =========================================================

/** Tọa độ khu vực trong sơ đồ mặt bằng (viewBox 0 0 100 100). */
export interface FunctionalAreaPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Một khu vực chức năng trong nhà (phòng khách, bếp, phòng tắm, hành lang...) từ API GET /api/houses. */
export interface FunctionalAreaFromApi {
  /** ID khu vực. */
  id: string;
  /** ID căn nhà chứa khu vực này. */
  houseId: string;
  /** Tên hiển thị (VD: Phòng khách, Bếp, Phòng tắm tầng 2). */
  name: string;
  /** Loại khu vực: LIVINGROOM, KITCHEN, BATHROOM, HALLWAY, BEDROOM, ... */
  areaType: string;
  /** Số tầng (chuỗi do BE trả về, VD: "1", "2"). */
  floorNo: string;
  /** Mô tả (có thể null). */
  description: string | null;
  /** Trạng thái (VD: NORMAL). */
  status?: string;
  /** Vị trí trong sơ đồ mặt bằng (từ BE; thiếu thì app đặt theo areaType). ViewBox 0–100 trên Cover_Floor_Plan. */
  position?: FunctionalAreaPosition;
  createdAt?: string;
  updatedAt?: string;
}

/** Dữ liệu căn nhà trả về từ API GET /api/houses (dùng cho Staff). */
export type HouseStatus = "AVAILABLE" | "RENTED" | "REPAIRED" | string;

/** Trạng thái truy cập nhà (tenant) từ GET /api/houses/my-access. */
export type TenantHouseAccessStatus =
  | "ACCESSIBLE"
  | "PENDING_HANDOVER"
  | "PENDING_DEPOSIT"
  | "PENDING_FIRST_RENT"
  | string;

/**
 * Vai trò thành viên trong nhóm thuê (GET /api/houses/my-access), VD: OWNER.
 */
export type TenantHouseMemberRole = "OWNER" | "MEMBER" | string;

/**
 * Một dòng trong `data` của GET /api/houses/my-access.
 * Luồng thanh toán: `hasUnpaidInvoice` + `pendingInvoiceId`; `accessStatus` / `reason` cho banner và chặn tính năng.
 */
export interface TenantHouseAccessFromApi {
  houseId: string;
  houseName: string;
  address: string;
  handoverDate: string;
  accessStatus: TenantHouseAccessStatus;
  /** Mã lý do từ BE (VD: ACCESS_PENDING_FIRST_RENT). */
  reason?: string | null;
  /** Còn hóa đơn chưa thanh toán — FE hiển thị banner / CTA thanh toán. */
  hasUnpaidInvoice?: boolean;
  /** Hóa đơn ưu tiên thanh toán (VNPay / chi tiết hóa đơn). */
  pendingInvoiceId?: string | null;
  /** Vai trò trong nhóm thuê nhà. */
  memberRole?: TenantHouseMemberRole;
  /** Tài liệu hợp đồng PDF — khi BE trả trong my-access. */
  contractDocuments?: TenantContractDocumentFromApi[];
}

/** Response GET /api/houses/my-access (wrapper giống các API khác). */
export interface TenantHouseAccessApiResponse {
  data: TenantHouseAccessFromApi[];
  message: string;
  statusCode: number;
  success: boolean;
}

/**
 * Một file hợp đồng / phụ lục (PDF) gắn với căn nhà.
 * BE có thể trả trong GET houses/my-access hoặc chi tiết nhà — map vào `HouseFromApi.contractDocuments`.
 */
export interface TenantContractDocumentFromApi {
  id?: string;
  title: string;
  /** URL đầy đủ (https) để mở/tải PDF. */
  pdfUrl: string;
}

// =========================================================
// Tenant invoices (endpoint thực tế sẽ bổ sung sau)
// =========================================================

export type TenantInvoicePaymentStatus =
  | "UNPAID"
  | "PAID"
  | "PENDING"
  | "OVERDUE"
  | "WAITING_PAYMENT"
  | string;

/** Một lượt/phiên thanh toán gắn hóa đơn (GET /api/payments/invoices/:id → `data.payments`). */
export interface InvoicePaymentAttemptFromApi {
  id: string;
  amount: number;
  method: string;
  status: string;
  gatewayTxnId?: string | null;
  paidAt?: string | null;
  createdAt?: string | null;
}

/** Một hóa đơn của tenant (danh sách + chi tiết — BE có thể gộp hoặc tách GET by id). */
export interface TenantInvoiceFromApi {
  id: string;
  /** Kỳ / mô tả ngắn (VD: Tiền thuê tháng 3/2026). */
  title: string;
  amount: number;
  currency?: string;
  dueDate?: string | null;
  issuedAt?: string | null;
  paidAt?: string | null;
  status: TenantInvoicePaymentStatus;
  houseId?: string | null;
  houseName?: string | null;
  notes?: string | null;
  /** Các trường chi tiết từ GET /api/payments/invoices */
  contractId?: string | null;
  type?: string | null;
  periodKey?: string | null;
  totalAmount?: number | null;
  baseAmount?: number | null;
  penaltyAmount?: number | null;
  createdAt?: string | null;
  /**
   * ID ticket sửa chữa khi hóa đơn phát sinh từ báo giá/issue (BE có thể trả `issueTicketId` | `issueId` | `ticketId`).
   * Dùng để gom nhóm trong danh sách và mở chi tiết ticket.
   */
  issueTicketId?: string | null;
}

/** Dữ liệu căn nhà trả về từ API GET /api/houses (dùng cho Staff). */
export interface HouseFromApi {
  /** ID căn nhà. */
  id: string;
  /** ID user đang thuê (nếu có), null nếu nhà đang trống. */
  userRentalId: string | null;
  /** ID khu vực (region), có thể null. */
  regionId?: string | null;
  /** Tên hiển thị của căn nhà (ví dụ: Phòng 101, Căn A2). */
  name: string;
  /** Địa chỉ đầy đủ dạng text do BE trả về. */
  address: string;
  /** Phường. */
  ward?: string;
  /** Quận/Huyện. */
  commune?: string;
  /** Thành phố. */
  city?: string;
  /** Mô tả thêm về căn nhà. */
  description?: string;
  /** Trạng thái nhà theo HouseStatus BE. */
  status?: HouseStatus;
  /** Danh sách khu vực chức năng trong nhà (phòng khách, bếp, phòng tắm...). */
  functionalAreas?: FunctionalAreaFromApi[];
  /** Ngày bàn giao / bắt đầu hiệu lực ở nhà (ISO 8601) — từ my-access. */
  handoverDate?: string;
  /** Trạng thái truy cập tenant — từ my-access. */
  accessStatus?: TenantHouseAccessStatus;
  /** Lý do khi chưa được vào nhà — từ my-access. */
  accessReason?: string | null;
  /** Còn hóa đơn chưa thanh toán — từ my-access. */
  hasUnpaidInvoice?: boolean;
  /** Hóa đơn chờ thanh toán (VNPay) — từ my-access. */
  pendingInvoiceId?: string | null;
  /** Vai trò trong nhóm thuê (OWNER, …) — từ my-access. */
  memberRole?: TenantHouseMemberRole;
  /** Tài liệu hợp đồng (PDF…) — khi BE trả về. */
  contractDocuments?: TenantContractDocumentFromApi[];
}

/** Response body của API GET /api/houses. */
export interface HousesApiResponse {
  /** Mảng danh sách căn nhà. */
  data: HouseFromApi[];
  /** Thông điệp từ BE (dùng cho debug/log). */
  message: string;
  /** HTTP status code mà BE mapping (ví dụ: 200, 401, 500). */
  statusCode: number;
  /** Cờ đánh dấu request thành công hay không. */
  success: boolean;
}

// =========================================================
// Asset Categories API (/api/asset/categories)
// =========================================================

/** Một danh mục thiết bị từ API GET /api/assets/categories (loại sản phẩm/thiết bị trong hệ thống). */
export interface AssetCategoryFromApi {
  /** ID danh mục. */
  id: string;
  /** Tên danh mục (ví dụ: IoT, Furniture, IT Equipment...). */
  name: string;
  /** Phần trăm bồi thường khi hư hỏng (do BE quy định). */
  compensationPercent: number;
  /** Mô tả chi tiết về danh mục. */
  description: string;
  /** Loại phát hiện (BE có thể trả về, ví dụ: EIF, NONI). */
  detectionType?: string;
}

/** Response body của API GET /api/asset/categories. */
export interface AssetCategoriesApiResponse {
  /** Danh sách các danh mục thiết bị. */
  data: AssetCategoryFromApi[];
}

/**
 * Response body của API GET /api/assets/categories/:id.
 * BE có thể trả thêm message/statusCode/success, nhưng UI chỉ cần `data`.
 */
export interface AssetCategoryByIdApiResponse {
  data: AssetCategoryFromApi;
  message?: string;
  statusCode?: number;
  success?: boolean;
}

/**
 * Body gửi lên khi tạo danh mục thiết bị mới (POST /api/asset/categories).
 * Khớp với API: name, compensationPercent, description.
 */
export interface CreateAssetCategoryRequest {
  /** Tên danh mục (ví dụ: "Máy lạnh", "Bóng đèn"). */
  name: string;
  /** Phần trăm bồi thường khi hư hỏng (0–100 hoặc theo quy định BE). */
  compensationPercent: number;
  /** Mô tả chi tiết về danh mục. */
  description: string;
}

/**
 * Response body của API POST /api/asset/categories (tạo danh mục thành công).
 * BE trả về data (danh mục vừa tạo), message, statusCode (201), success.
 */
export interface CreateAssetCategoryApiResponse {
  /** Danh mục vừa được tạo (có id do BE sinh). */
  data: AssetCategoryFromApi;
  /** Thông báo từ BE (ví dụ: "Create category successfully"). */
  message: string;
  /** Mã HTTP (201 = Created). */
  statusCode: number;
  /** Cờ thành công. */
  success: boolean;
}

/**
 * Body gửi lên khi cập nhật danh mục (PUT /api/asset/categories/:id).
 * Cùng cấu trúc với Create: name, compensationPercent, description.
 */
export type UpdateAssetCategoryRequest = CreateAssetCategoryRequest;

/**
 * Response body của API PUT /api/asset/categories/:id (cập nhật thành công).
 */
export interface UpdateAssetCategoryApiResponse {
  data: AssetCategoryFromApi;
  message: string;
  statusCode: number;
  success: boolean;
}

// =========================================================
// Asset Items API (/api/asset/items)
// =========================================================

/** Tham số filter cho GET /api/asset/items (tùy chọn theo nhà, danh mục, hoặc NFC). */
export type AssetItemsParams = {
  /** Lọc theo ID căn nhà. */
  houseId?: string;
  /** Lọc theo ID danh mục thiết bị. */
  categoryId?: string;
  /** Lọc theo mã NFC đã gán (thường trả về tối đa 1 thiết bị). Một số BE hỗ trợ query ?nfcId=xxx. */
  nfcId?: string;
};

/**
 * Trạng thái thiết bị (asset) theo enum BE: không AVAILABLE / DELETED.
 * BE cũ: `AVAILABLE` → IN_USE; `DELETED` → DISPOSED (chuẩn hóa trong `normalizeAssetItemStatusFromApi`).
 */
export type AssetStatus = "IN_USE" | "ACTIVE" | "BROKEN" | "DISPOSED";

export function normalizeAssetItemStatusFromApi(
  status: string | null | undefined
): string {
  const s = status != null ? String(status).trim() : "";
  if (s === "" || s === "AVAILABLE") return "IN_USE";
  if (s === "DELETED") return "DISPOSED";
  return s;
}

/** Một thiết bị/item từ API GET /api/asset/items (có thể filter theo houseId, categoryId). */
export interface AssetItemFromApi {
  /** ID thiết bị. */
  id: string;
  /** ID căn nhà chứa thiết bị này. */
  houseId: string;
  /** ID danh mục thiết bị (khóa ngoại sang AssetCategoryFromApi). */
  categoryId: string;
  /** Tên hiển thị cho thiết bị (ví dụ: Máy lạnh phòng khách). */
  displayName: string;
  /** Số serial (do nhà sản xuất). */
  serialNumber: string;
  /** NFC tag ID gắn với thiết bị (từ bảng asset tags), null nếu chưa gán. */
  nfcTag: string | null;
  /** QR tag ID gắn với thiết bị, null nếu chưa gán. */
  qrTag: string | null;
  /** Danh sách tags (NFC, QR, ...) gắn với thiết bị (nếu BE hỗ trợ trả về). */
  tags?: AssetTagFromApi[];
  /** Tình trạng còn lại (%), ví dụ 80 = còn tốt 80%. */
  conditionPercent: number;
  /** Trạng thái (AssetStatus; sau khi qua service thường đã chuẩn hóa, không còn AVAILABLE). */
  status: string;
  /**
   * ID khu vực chức năng trong nhà; null nếu chưa gán.
   * BE có thể trả `functionAreaId` hoặc `functionalAreaId` — service chuẩn hóa về `functionAreaId`.
   */
  functionAreaId?: string | null;
}

/** Response body của API GET /api/asset/items. */
export interface AssetItemsApiResponse {
  /** Danh sách các thiết bị. */
  data: AssetItemFromApi[];
}

/**
 * Body gửi lên khi tạo thiết bị mới (POST /api/asset/items).
 * Khớp API: houseId, categoryId, displayName, serialNumber, nfcTag, conditionPercent, status.
 */
export interface CreateAssetItemRequest {
  houseId: string;
  categoryId: string;
  displayName: string;
  serialNumber: string;
  /** Có thể chuỗi hoặc null nếu chưa gán NFC. */
  nfcTag: string | null;
  /** Có thể chuỗi hoặc null nếu chưa gán QR. */
  qrTag: string | null;
  conditionPercent: number;
  /** Trạng thái (AssetStatus). */
  status: string;
  /** Gán vào khu vực chức năng (tùy chọn). */
  functionAreaId?: string | null;
}

/** Response body của API POST /api/asset/items (tạo thiết bị thành công). */
export interface CreateAssetItemApiResponse {
  data: AssetItemFromApi;
  message: string;
  statusCode: number;
  success: boolean;
}

/** Body cập nhật thiết bị (PUT /api/asset/items/:id). Có thể dùng cùng cấu trúc create. */
export type UpdateAssetItemRequest = CreateAssetItemRequest;

/** Response PUT /api/asset/items/:id. */
export interface UpdateAssetItemApiResponse {
  data: AssetItemFromApi;
  message: string;
  statusCode: number;
  success: boolean;
}

// =========================================================
// Asset Tags — POST /api/assets/tags (gán), PUT /api/assets/tags/detach/{tagValue} (gỡ)
// =========================================================

/** Body gửi lên khi gán tag (POST /api/assets/tags). */
export interface AttachAssetTagRequest {
  /** ID thiết bị (asset item) cần gán tag. */
  assetId: string;
  /** Giá trị mã NFC (ví dụ "010101010" hoặc "04 9C 59 A2 B2 19 90"). */
  tagValue: string;
  /** Loại tag, thường là "NFC" hoặc "QR_CODE". */
  tagType: "NFC" | "QR_CODE";
}

/** Dữ liệu tag trả về từ POST /api/assets/tags khi gán thành công. */
export interface AssetTagFromApi {
  id: string;
  tagValue: string;
  tagType: string;
  assetId: string;
  houseId: string;
  activatedAt: string;
  isActive: boolean;
}

/** Response body của API POST /api/assets/tags. */
export interface AttachAssetTagApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: AssetTagFromApi;
}

/** Response body của API PUT /api/assets/tags/detach/{tagValue}. */
export type DetachAssetTagApiResponse = AttachAssetTagApiResponse;

/** Response của GET /api/assets/tags/asset/{tagValue} (quét NFC/QR → item). */
export interface GetAssetByTagValueApiResponse {
  statusCode: number;
  success: boolean;
  message: string;
  /** Một object thiết bị (Postman) hoặc mảng (tương thích cũ). */
  data: AssetItemFromApi[] | AssetItemFromApi;
}

// =========================================================
// IoT Devices API (/api/assets/iot-devices) — đồng bộ Staff app
// =========================================================

/**
 * Một node IoT trong `data.devices` từ GET /api/assets/iot-devices/house/{houseId}.
 */
export interface IotNodeDeviceFromApi {
  id: string;
  assetId: string;
  categoryCode: string;
  displayName: string;
  serialNumber: string;
  status: string;
  /** Thing name để subscribe telemetry (nếu dùng cho từng node). */
  thing: string;
  areaName: string | null;
}

/**
 * Controller + danh sách node của một nhà (object trong `data` của response).
 */
export interface IotControllerHouseDataFromApi {
  id: string;
  houseName: string;
  deviceId: string;
  /** Thing name của controller — dùng cho MQTT/telemetry (thay `thingId` cứng khi BE sẵn sàng). */
  thingName: string;
  status: string;
  areaName: string | null;
  createdAt?: string;
  activatedAt?: string;
  devices: IotNodeDeviceFromApi[];
}

/** Response: ApiResponse<IotControllerHouseDataFromApi> */
export type IotDevicesByHouseApiResponse = ApiResponse<IotControllerHouseDataFromApi>;

// =========================================================
// IoT alerts (GET /api/assets/houses/{houseId}/iot/alerts)
// =========================================================

export type IotAlertLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "WARNING"
  | "CRITICAL"
  | "INFO";

export interface IotAlertItem {
  alertId: string;
  houseId: string;
  areaId?: string | null;
  areaName?: string | null;
  thing: string;
  alertType: string;
  title: string;
  detail?: string | null;
  metric?: string | null;
  value?: number | null;
  level: IotAlertLevel | string;
  resolved?: boolean;
  ts: number;
  date?: string;
}

/** Trang phân trang cursor từ BE (nằm trong `data` của response). */
export interface HouseIotAlertsPageData {
  items: IotAlertItem[];
  hasMore?: boolean;
  nextCursor?: string | null;
  cursor?: string | null;
}

/** Response có thể dùng wrapper ApiResponse hoặc object tối giản tùy BE — giữ cả hai alias cho an toàn. */
export type HouseIotAlertsApiResponse = ApiResponse<HouseIotAlertsPageData>;

// =========================================================
// Issues / Tickets (tenant)
// =========================================================

/** Trạng thái ticket/issue từ BE (IssueStatus). */
export type IssueStatus =
  | "CREATED"
  | "NEED_RESCHEDULE"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "WAITING_MANAGER_CONFIRM"
  | "WAITING_MANAGER_APPROVAL_QUOTE"
  | "WAITING_TENANT_APPROVAL_QUOTE"
  | "WAITING_PAYMENT"
  | "DONE"
  | "CLOSED"
  | "CANCELLED"
  | string;

/** Trạng thái báo giá từ BE (QuoteStatus). */
export type QuoteStatus =
  | "DRAFT"
  | "WAITING_MANAGER_APPROVAL"
  | "WAITING_TENANT_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | string;

/** Alias giữ tương thích ngược cho các chỗ cũ đang dùng tên TenantTicketStatus. */
export type TenantTicketStatus = IssueStatus;

/** Một ticket do tenant gửi (danh sách / chi tiết sau này). */
export interface TenantTicketFromApi {
  id: string;
  tenantId: string;
  houseId: string;
  assetId: string;
  assignedStaffId: string | null;
  /**
   * Mức ưu tiên hiển thị (BE có thể trả): EMERGENCY / HIGH / STANDARD, …
   * Thiếu trường → UI coi là tiêu chuẩn.
   */
  priority?: string | null;
  /**
   * Tên nhân viên phụ trách (BE có thể trả ở endpoint ticket-by-id).
   * Nếu endpoint danh sách không có, có thể null/undefined.
   */
  staffName?: string | null;
  /**
   * Số điện thoại nhân viên phụ trách (BE có thể trả ở endpoint ticket-by-id).
   * Nếu endpoint danh sách không có, có thể null/undefined.
   */
  staffPhone?: string | null;
  slotId: string | null;
  type: string;
  status: IssueStatus;
  quoteStatus?: QuoteStatus | null;
  title: string;
  description: string;
  createdAt: string;
}

// =========================================================
// Work Slots API (/api/schedules/work_slots/staff/{staffId}) — dùng cho tenant hiển thị thời gian dự kiến
// =========================================================

export interface WorkSlotFromApi {
  id: string;
  staffId: string;
  jobId: string;
  /** ID căn nhà mà job thuộc về (BE có thể trả thêm trường này). */
  houseId?: string;
  jobType: string;
  /** Thời gian bắt đầu (ISO 8601). */
  startTime: string;
  /** Thời gian kết thúc (ISO 8601). */
  endTime: string;
  /** Trạng thái job: CREATED, SCHEDULED, NEED_RESCHEDULE, IN_PROGRESS, COMPLETED, FAILED, CANCELLED, OVERDUE */
  status: string;
}

export interface WorkSlotsApiResponse {
  data: WorkSlotFromApi[];
  message: string;
  statusCode: number;
  success: boolean;
}

/** Response body của GET /api/schedules/work_slots/{slotId}. */
export interface WorkSlotByIdApiResponse {
  data: WorkSlotFromApi;
  message: string;
  statusCode: number;
  success: boolean;
}

/** Một phản hồi từ staff cho ticket (GET /api/issues/responses). */
export interface IssueTicketResponseFromApi {
  id: string;
  ticketId: string;
  actorId: string;
  content: string;
  createdAt: string;
}

/** Banner báo giá/sửa chữa cho luồng quote + payment (GET /api/issues/banners). */
export interface IssueBannerFromApi {
  id: string;
  name: string;
  currentPrice: number;
}

// =========================================================
// Issues / Quotes (tenant quote + payment flow)
// =========================================================

/** Một item bên trong quote (GET /api/issues/quotes/ticket/:ticketId) */
export interface IssueQuoteItemFromApi {
  id: string;
  itemName: string;
  description?: string | null;
  price: number;
  /** Hạng mục chọn từ banner — BE có thể trả để tách với hạng mục ngoài banner. */
  bannerId?: string | null;
  /** Giá vốn (hạng mục ngoài banner) — tùy BE. */
  cost?: number | null;
}

/** Một quote cho một ticket (GET /api/issues/quotes/ticket/:ticketId) */
export interface IssueQuoteFromApi {
  id: string;
  issueId: string;
  staffId?: string | null;
  assetId?: string | null;
  tenantId?: string | null;
  totalPrice: number;
  status: QuoteStatus | string;
  items: IssueQuoteItemFromApi[];
  createdAt?: string | null;
}

