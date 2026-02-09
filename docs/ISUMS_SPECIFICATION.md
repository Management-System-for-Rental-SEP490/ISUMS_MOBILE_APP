# ISUMS Project Specification

(IoT Base Smart Utility Management System for Rental Properties on HCM City)

## 1. Project Overview

- **Project Code**: SP26SE118
- **Group**: GSP26SE02
- **Description**: Hệ thống quản lý nhà trọ thông minh tích hợp IoT để giám sát điện/nước theo thời gian thực, quản lý thiết bị/tài sản gắn liền với hợp đồng thuê, và hỗ trợ quy trình bảo trì/sửa chữa.
- **Target Audience**: Chủ nhà trọ cá nhân (Landlord), Quản lý (Manager), Nhân viên kỹ thuật (Technical Staff), Người thuê (Tenant).

## 2. Technology Stack

- **Mobile App**: React Native (Expo), TypeScript, Zustand (State Management), React Query.
- **Web App**: ReactJS + TypeScript.
- **Backend**: Java Spring Boot (Microservices Architecture).
- **Authentication**: Keycloak (OIDC/OAuth2).
- **Database**: PostgreSQL (Amazon RDS), Redis (Caching), InfluxDB/Time-series DB (Optional for IoT data).
- **IoT Cloud**: AWS IoT Core, MQTT Protocol.
- **AI/ML**: Extended Isolation Forest (Anomaly Detection), Prophet (Forecasting) - deployed on AWS Lambda/Python.
- **Infrastructure**: AWS (EC2, S3, RDS, Lambda).
- **Payment**: VNPay Integration.

## 3. Core Features (Mobile Focus)

### 3.1. Authentication & User Management (FE-01, FE-03)

- **Login/Logout**: Tích hợp Keycloak.
- **Role-based Access**: Tenant, Technical Staff, Manager, Landlord.
- **Tenant Onboarding**: Thông tin người thuê, liên kết với hợp đồng.

### 3.2. Utility Monitoring (FE-04, FE-05, FE-17)

- **Real-time Monitoring**: Xem chỉ số điện/nước hiện tại theo từng khu vực (Bếp, Phòng khách, v.v.).
- **Historical Data**: Biểu đồ tiêu thụ theo giờ, ngày, tháng.
- **AI Alerts**: Cảnh báo rò rỉ nước, tiêu thụ điện bất thường (Spike detection).
- **Control**: Bật/tắt thiết bị IoT từ xa (Role-based & Ticket-based constraint).

### 3.3. Device & Asset Management (FE-09 -> FE-14)

- **Inventory**: Danh sách thiết bị trong nhà/phòng.
- **NFC Identification (FE-18)**: Quét thẻ NFC trên thiết bị để xem thông tin chi tiết và lịch sử bảo trì.
- **Condition Tracking**: Ghi nhận tình trạng thiết bị (Mới, Cũ, Hỏng) kèm ảnh chụp minh chứng.
- **Contract Appendix**: Phụ lục thiết bị đi kèm hợp đồng thuê.

### 3.4. Maintenance & Issue Reporting (FE-14 -> FE-16, FE-19 -> FE-21)

- **Create Ticket**: Tenant quét NFC hoặc chọn thiết bị để báo hỏng.
- **Inspection Checklist**: Technical Staff thực hiện kiểm tra định kỳ theo danh sách, tick chọn và upload ảnh hiện trạng.
- **Quotation**: Báo giá sửa chữa (theo danh sách giá hoặc báo giá riêng).
- **Payment**: Thanh toán phí bảo trì qua VNPay hoặc tiền mặt.

### 3.5. Notifications (FE-06)

- Cảnh báo bất thường (AI detected).
- Nhắc nhở lịch kiểm tra định kỳ.
- Cập nhật trạng thái phiếu bảo trì/sửa chữa.

## 4. Key Workflows

### 4.1. NFC Inspection Flow

1. Staff đến phòng -> Mở App -> Chọn chế độ Inspection.
2. Quét thẻ NFC trên thiết bị.
3. App hiển thị thông tin thiết bị & lịch sử.
4. Staff cập nhật tình trạng hiện tại + Chụp ảnh (nếu cần).
5. Submit báo cáo kiểm tra.

### 4.2. Maintenance Ticket Flow

1. Tenant phát hiện hỏng hóc -> Quét NFC thiết bị -> Tạo Ticket (kèm ảnh/mô tả).
2. Manager tiếp nhận -> Phân công Staff (hoặc Staff tự nhận slot).
3. Staff đến sửa -> Check-in -> Cập nhật kết quả sửa chữa -> Báo giá (nếu có phí).
4. Tenant/Manager duyệt báo giá -> Thực hiện sửa.
5. Thanh toán (VNPay/Cash) -> Đóng Ticket.

## 5. Directory Structure Alignment

Current `src/` structure seems aligned with features:

- `features/auth`: Login, Onboarding.
- `features/consumption`: Electric/Water Usage Screens.
- `features/devices`: Device Details (Need to implement NFC here).
- `features/house`: Home, Tenants, Profile.
- `features/billing`: Billing/Payment.
- `shared/services/keycloakAuth.ts`: Auth Service.

