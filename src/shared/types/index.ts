import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { ColorValue } from "react-native";
import type {
  AssetCategoryFromApi,
  AssetItemFromApi,
  FunctionalAreaFromApi,
  IssueTicketResponseFromApi,
  TenantContractDocumentFromApi,
  TenantEContractFromApi,
  TenantHouseAccessStatus,
  TenantHouseMemberRole,
  TenantInvoiceFromApi,
  TenantTicketFromApi,
} from "./api";

export type AuthStackParamList = {
  AuthLogin: undefined;
};

export type HeaderVariant = "default" | "electric" | "water"; // định nghĩa các loại variant của header
export type RootStackParamList = AuthStackParamList & {
  Main: undefined;
  OnBoarding: undefined;
  /** Quét QR/NFC cho tenant: tra cứu thiết bị thuộc nhà đang chọn, mở TenantItemDetail. */
  Camera: undefined | { initialScanMode?: "qr" | "nfc" };
  /** Chi tiết thiết bị (tenant): nhận item từ danh sách, fetch theo id, hiển thị giống ItemDescription, có nút Báo cáo sự cố. */
  TenantItemDetail: { item: AssetItemFromApi };
  /**
   * Tạo ticket tenant (POST /issues/tickets).
   * `houseId` bắt buộc; có `presetAsset` khi vào từ chi tiết thiết bị, không có khi vào từ danh sách ticket (+ chọn thiết bị trong form).
   * `presetTicketType`: mặc định REPAIR; QUESTION khi vào từ danh sách giải đáp thắc mắc.
   */
  Ticket: {
    houseId: string;
    presetAsset?: { id: string; displayName: string };
    presetTicketType?: "REPAIR" | "QUESTION";
  };
  /** Danh sách ticket tenant đã gửi (từ hồ sơ / ứng dụng). */
  TenantTicketList: undefined;
  /** Chi tiết một ticket (dữ liệu từ danh sách + tên thiết bị fetch theo assetId). */
  TenantTicketDetail: { ticket: TenantTicketFromApi };
  /** Danh sách phản hồi cho ticket hỏi đáp (GET /issues/responses + lọc theo ticket QUESTION). */
  TenantQuestionList: undefined;
  /** Chi tiết một phản hồi (đủ trường từ API). */
  TenantQuestionDetail: { response: IssueTicketResponseFromApi; zoneLabel?: string };
  /** Chi tiết nhà (tenant): mô tả căn nhà, khu vực chức năng. */
  BuildingDetail: {
    buildingId: string;
    buildingName: string;
    buildingAddress: string;
    /** Mô tả căn nhà (từ API) */
    description?: string;
    /** Phường / xã (`HouseFromApi.ward`) */
    ward?: string;
    /** Quận / huyện (`HouseFromApi.commune`) */
    commune?: string;
    /** Tỉnh / thành phố (`HouseFromApi.city`) */
    city?: string;
    /** Trạng thái: AVAILABLE, RENTED, ... (từ API) */
    status?: string;
    /** Danh sách khu vực chức năng trong nhà (từ API houses.functionalAreas). */
    functionalAreas?: FunctionalAreaFromApi[];
    /** File hợp đồng PDF (khi BE/map từ `HouseFromApi.contractDocuments`). */
    contractDocuments?: TenantContractDocumentFromApi[];
    /** Từ GET /api/houses/my-access — hiển thị banner thanh toán / trạng thái truy cập. */
    hasUnpaidInvoice?: boolean;
    pendingInvoiceId?: string | null;
    accessStatus?: TenantHouseAccessStatus;
    accessReason?: string | null;
    memberRole?: TenantHouseMemberRole;
  };
  /**
   * Danh sách hóa đơn — chọn nhiều hóa đơn & thanh toán VNPay.
   * `issueTicketId`: gợi ý ngữ cảnh khi vào từ ticket sửa chữa.
   */
  TenantInvoiceList: undefined | { issueTicketId?: string | null };
  /** Chi tiết một hóa đơn + thanh toán đơn. */
  TenantInvoiceDetail: { invoice: TenantInvoiceFromApi };
  /** Hóa đơn sửa chữa / ticket: tổng quan + lịch sử lượt thanh toán. */
  TenantIssueInvoice: { invoice: TenantInvoiceFromApi };
  /**
   * WebView VNPay — `checkoutUrl` từ POST tạo link (tiền nhà: `invoiceIds`, sửa chữa: `quoteId`).
   * Sau redirect, app hiển thị màn kết quả trong app rồi `afterSuccess` thoát (không tải HTML `vnp_ReturnUrl`).
   */
  VnpayCheckout: {
    checkoutUrl: string;
    afterSuccess?: "invoiceList" | "home" | "ticketDetail";
    /** Khi `afterSuccess` = `ticketDetail` — dùng để reset stack về đúng ticket. */
    ticketForAfterSuccess?: TenantTicketFromApi;
    /**
     * Tuỳ chọn — chỉnh copy màn xác nhận/kết quả (tiền nhà dùng `house_invoice`).
     * `repair_quote`: thanh toán báo giá ticket; `repair_fee_invoice`: hóa đơn phí sửa chữa.
     */
    vnpayUiContext?: "house_invoice" | "repair_quote" | "repair_fee_invoice";
  };
  /** Trang tiêu thụ (gộp điện + nước) với switch toggle. */
  ConsumptionScreen: { initialTab?: "electric" | "water" } | undefined;
  /** Thông báo (chuyển từ tab sang stack screen). */
  NotificationScreen: undefined;
  /** Chi tiết cảnh báo IoT (từ banner hoặc danh sách). */
  IotAlertDetail: { houseId: string; alertId: string };
  /** Hồ sơ cá nhân (chuyển từ tab sang stack screen). */
  ProfileScreen: undefined;
  /** Chi tiết hợp đồng điện tử (dữ liệu từ GET /api/econtracts/my). */
  UserContractDetail: { contract: TenantEContractFromApi };
};

export type IconProps = {
  size?: number;
  color?: ColorValue;
};
export type LogoProps = {
  width?: number;
  height?: number;
};

export type UserRole = "tenant"| "technical";

export type AuthPayload = {
  username: string;
  role: UserRole;
  token: string;
  idToken?: string; // Thêm idToken để dùng cho logout
  // refreshToken là một chuỗi (string) được sử dụng để lấy lại (làm mới) access token khi access token hết hạn. 
  // Nó giúp người dùng không cần đăng nhập lại mỗi khi phiên làm việc (session) bị timeout.
  refreshToken?: string;
  /** ID căn nhà mà user (tenant) đang thuê. */
  houseId?: string;
};

/** Phiên WebView Keycloak toàn cục (đổi MK / sau này logout-account), giống overlay đăng nhập. */
export type KeycloakInAppSession = {
  url: string;
  flow: "change_password";
};

export type AuthState = {
  user: string | null;
  role: UserRole | null;
  token: string | null;
  idToken: string | null; // Thêm vào state
  refreshToken: string | null;
  /** ID căn nhà của tenant (nếu có). */
  houseId: string | null;
  isLoggedIn: boolean;
  onboardedUsers: string[]; // Danh sách username đã xem onboarding
  keycloakInAppSession: KeycloakInAppSession | null;
  setKeycloakInAppSession: (s: KeycloakInAppSession | null) => void;
  login: (data: AuthPayload) => void;
  logout: () => void;
  completeOnboarding: () => void; // Hàm xác nhận user hiện tại đã xem xong
  setHouseId: (id: string | null) => void;
};
export type RegisterState = {
  username: string;
  email: string;
  password: string;
  setUsername: (username: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
};
export type ForgotPasswordState = {
  email: string;
  setEmail: (email: string) => void;
  sendEmail: () => void;
};
// chưa sài
export type MenuModalState = {
  visible: boolean;
  open: () => void;
  close: () => void;
};
// quản lý thông tin người dùng trong màn hình profile
export type UserState = {
  name: string;
  email: string;
  password: string;
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPassword: (password: string) => void;
}; 
export type DeviceType = "electric" | "water" | "other";
export type DeviceStatus = "active" | "inactive" | "maintenance" | "pending";
export type Device = {
  id: string;
  name: string;
  type: DeviceType;
  nfcTagId: string;
  location: string;
  status: DeviceStatus;
  metadata?: {
    serialNumber?: string;
    manufacturer?: string;
    model?: string;
    installationDate?: string;
  };
};
export interface RentalHouse {
  id: string;
  name: string; // Tên phòng/nhà (VD: Phòng 101, Căn hộ A2)
  address: string;
  contractId: string; // Mã hợp đồng
  contractStatus: 'Active' | 'Expired' | 'Pending';
  startDate: string; // Ngày bắt đầu thuê
  endDate: string; // Ngày kết thúc
}

// Các kiểu dữ liệu liên quan đến API (HouseFromApi, AssetCategoryFromApi, AssetItemFromApi, ...)
// đã được di chuyển sang file riêng `types/api.ts` cho dễ bảo trì.
// Tại đây chỉ re-export lại để ai đang import từ "shared/types" vẫn dùng được.
export type {
  ApiResponse,
  HouseStatus,
  HouseFromApi,
  HousesApiResponse,
  FunctionalAreaFromApi,
  AssetCategoryFromApi,
  AssetCategoryEmbeddedFromApi,
  AssetCategoriesApiResponse,
  AssetItemsParams,
  AssetItemFromApi,
  AssetItemsApiResponse,
  UserProfileResponse,
  TenantTicketFromApi,
  IssueStatus,
  QuoteStatus,
  TenantTicketStatus,
  IssueTicketResponseFromApi,
  TenantContractDocumentFromApi,
  TenantHouseAccessFromApi,
  TenantHouseAccessStatus,
  TenantHouseMemberRole,
  TenantInvoiceFromApi,
  TenantInvoicePaymentStatus,
  InvoicePaymentAttemptFromApi,
  TenantEContractFromApi,
  VnpayPaymentCreateRequest,
  VnpayPaymentLinkApiResponse,
  VnpayReturnValidationApiResponse,
} from "./api";

export type {
  TelemetryMessage,
  TelemetryStream,
  TelemetryFeatures,
  UsageData,
  AlertWsMessage,
  WsAlertItem,
} from "./iot";

export type { IAlert } from "./alert";

export type ScanMode = "qr" | "nfc";
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, "Main">;

// Alert Types
export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  type: AlertType;
  show: (title: string, message?: string, buttons?: AlertButton[], type?: AlertType) => void;
  hide: () => void;
}
