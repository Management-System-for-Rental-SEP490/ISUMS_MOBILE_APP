# ISUMS Mobile App – Đặc tả & Kịch bản Chuẩn

> **Dự án:** ISUMS (IoT Base Smart Utility Management System)  
> **App:** Tenant + Staff (2 role trong 1 app)

---

## 1. Tổng quan

| | |
|---|---|
| **Project Code** | SP26SE118 |
| **Roles** | Tenant (người thuê), Staff (thợ kỹ thuật) |
| **Stack** | React Native (Expo), TypeScript, Zustand, React Query, Keycloak |

---

## 2. Kịch bản Chuẩn Cho Từng Màn Hình / Form

### 2.1. Login (LoginScreen)
- **Luồng:** User mở app → Chọn ngôn ngữ → Nhấn "Đăng nhập" → Mở WebView Keycloak → Nhập tài khoản → Redirect về app với code → Đổi code lấy token → Lưu token + role vào Zustand.
- **Data:** Keycloak (API thật). Không mock.

### 2.2. Onboarding (onBoarding)
- **Luồng:** User mới (chưa trong onboardedUsers) → Xem slides giới thiệu → Nhấn "Bắt đầu" → Gọi completeOnboarding() → Chuyển vào Main.
- **Data:** Local state. Không mock.

### 2.3. Tenant – Home (HomeScreen)
- **Luồng:** Hiển thị tổng quan nhà, tiêu thụ điện/nước, shortcut. Nhấn thiết bị → DeviceDetail.
- **Data:** useTenantHouses (API), useTenantContext. Một số IoT/usage có thể mock cho đến khi có API.

### 2.4. Tenant – Tiêu thụ Điện (ElectricUsageScreen)
- **Luồng:** Biểu đồ tiêu thụ theo thời gian.
- **Data:** Có thể mock. **Khi có API từ BE: thay mock bằng API, xóa mock.**

### 2.5. Tenant – Tiêu thụ Nước (WaterUsageScreen)
- **Luồng:** Tương tự ElectricUsage.
- **Data:** Có thể mock. **Khi có API từ BE: thay mock bằng API, xóa mock.**

### 2.6. Tenant – Tạo Ticket (TicketScreen)
- **Luồng:** User chọn device (từ DeviceDetail) → Mở form Ticket → Điền title, description, priority → Submit.
- **Data:** **MOCK / TODO API.** Hiện chỉ Alert thành công. **Khi có API từ BE: gọi API tạo ticket, xóa logic mock.**

### 2.7. Tenant – Thông báo (NotificationScreen)
- **Luồng:** Danh sách thông báo (ticket, cảnh báo điện/nước).
- **Data:** **MOCK** (`MOCK_NOTIFICATIONS`). **Khi có API từ BE: thay bằng useQuery/API, xóa mock.**

### 2.8. Staff – Home (StaffHomeScreen)
- **Luồng:** Lịch tuần + danh sách asset theo category. Nhấn asset → ItemDescription.
- **Data:** **MOCK** – `getWorkScheduleThisWeek`, `MOCK_STAFF_ASSETS` từ `mockStaffData.ts`. Houses: `useHouses` (API). **Khi có API từ BE: thay lịch + asset bằng API, xóa mock.**

### 2.9. Staff – Danh sách Ticket (TicketListScreen)
- **Luồng:** Danh sách ticket, filter status/priority. Nhấn item → TicketDetail.
- **Data:** **MOCK** (`MOCK_STAFF_TICKETS`). **Khi có API từ BE: thay bằng useQuery, xóa mock.**

### 2.10. Staff – Chi tiết Ticket (TicketDetailScreen)
- **Luồng:** Hiển thị thông tin ticket. Nút "Nhận Ticket" → Mở BookScheduleModal → Chọn slot → Gán ticket.
- **Data:** **MOCK** – getTicketById, gán ticket chưa gọi API. **Khi có API từ BE: gọi API nhận ticket, đặt lịch, xóa mock.**

### 2.11. Staff – Lịch làm việc (CalendarScreen)
- **Luồng:** Hiển thị lịch tuần, đăng ký slot tuần sau.
- **Data:** **MOCK** – `getWorkScheduleThisWeek`, `MOCK_TICKET_ASSIGNMENTS`, `MOCK_NEXT_WEEK_SLOTS`. **Khi có API từ BE: thay bằng API, xóa mock.**

### 2.12. Staff – Chi tiết Building (BuildingDetailScreen)
- **Luồng:** Danh sách thiết bị trong nhà, nút gán NFC.
- **Data:** Houses: API (`useHouses`). Assets: `getStaffAssetsByBuildingId` từ **mockStaffData** hoặc `useAssetItems`. **Khi có API từ BE: dùng useAssetItems/houseId, xóa mock nếu còn.**

### 2.13. Staff – Danh mục (CategoryListScreen, CategoryEditScreen)
- **Luồng:** CRUD danh mục thiết bị.
- **Data:** `useAssetCategories` (API). Không mock.

### 2.14. Staff – Thiết bị (ItemListScreen, ItemCreateScreen, ItemEditScreen, itemDescription)
- **Luồng:** CRUD thiết bị, xem chi tiết.
- **Data:** `useAssetItems`, `assetItemApi` (API). Không mock.

### 2.15. Staff – Thông báo (StaffNotificationScreen)
- **Luồng:** Danh sách thông báo cho Staff.
- **Data:** **MOCK** (`MOCK_STAFF_NOTIFICATIONS`). **Khi có API từ BE: thay bằng API, xóa mock.**

### 2.16. Camera (Quét QR/NFC)
- **Luồng:** Staff: assign NFC, lookup. Tenant: lookup device.
- **Data:** `getAssetItemByNfcId` (API), `deviceData` (có mock lookup). **Khi có API từ BE: đảm bảo lookup dùng API, xóa mock nếu còn.**

### 2.17. User Profile (UserProfileScreen)
- **Luồng:** Hiển thị thông tin user, đổi ngôn ngữ, đăng xuất.
- **Data:** `useUserProfile` (API), `useAuthStore`.

---

## 3. Tổng hợp Mock Data – Hành động khi có API

| Nguồn | File / Biến | Hành động khi có API |
|-------|-------------|----------------------|
| **mockStaffData.ts** | `MOCK_STAFF_TICKETS`, `MOCK_TICKET_ASSIGNMENTS`, `MOCK_NEXT_WEEK_SLOTS`, `MOCK_BUILDINGS`, `MOCK_STAFF_ASSETS`, `getWorkScheduleThisWeek`, `getStaffAssetsByBuildingId`, `getTicketById` | Thay bằng React Query + API. Xóa mock. |
| **StaffNotificationScreen** | `MOCK_STAFF_NOTIFICATIONS` | Thay bằng useQuery/API. Xóa mock. |
| **NotificationScreen** (Tenant) | `MOCK_NOTIFICATIONS` | Thay bằng useQuery/API. Xóa mock. |
| **TicketScreen** (Tenant) | Submit form | Gọi API tạo ticket. Xóa TODO. |
| **TicketDetailScreen** | Gán ticket vào slot | Gọi API. Xóa TODO. |
| **deviceData.ts** | `mockDevices`, lookup by NFC | Dùng API lookup. Xóa mock nếu không cần. |
| **mockHouseService.ts** | `MOCK_HOUSE` | Chỉ dùng nếu houseApi fallback. Ưu tiên xóa khi API ổn định. |
| **authData.ts** | `mockLogin` | Chỉ dùng dev. Production dùng Keycloak. |

---

## 4. Cấu trúc thư mục

```
src/
├── features/
│   ├── staff/          # Staff screens
│   ├── tenant/         # Tenant screens
│   ├── screens/        # Login, Onboarding, UserProfile
│   └── modal/camera/   # Camera
├── shared/             # API, services, hooks, i18n, types
├── store/              # Zustand
└── navigation/
```

---

## 5. Skills tham chiếu

- `.agents/skills/vercel-react-native-skills` – Rules React Native
