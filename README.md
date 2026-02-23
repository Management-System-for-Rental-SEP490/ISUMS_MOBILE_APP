# 🏠 ISUMS - Mobile Application

<div align="center">
  <img src="./assets/logob.png" alt="ISUMS Logo" width="200" height="200"/>
  
  **Capstone Project - Mobile Application**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-~54.0.29-000020?logo=expo)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## 📋 Mô tả

ISUMS (IoT-based Smart Utility Management System) là ứng dụng mobile được xây dựng bằng React Native và Expo Framework, phục vụ cho hệ thống quản lý tiện ích thông minh trong các căn hộ cho thuê. Ứng dụng hỗ trợ quản lý điện, nước, hóa đơn sửa chữa, báo cáo sự cố, quản lý thiết bị và cư dân cho các vai trò khác nhau (tenant, Staff, Landlord, Manager).

## 🚀 Công nghệ sử dụng

### Core Framework
- **React Native 0.81.5** - Framework phát triển ứng dụng mobile
- **Expo ~54.0.29** - Toolchain và platform cho React Native
- **TypeScript 5.9.2** - Ngôn ngữ lập trình với type safety
- **React 19.1.0** - UI library

### State Management & Data Fetching
- **Zustand 5.0.9** - State management (quản lý state dùng chung)
- **React Query (@tanstack/react-query) 5.90.12** - Quản lý server state và API calls
- **Axios 1.7.0** - HTTP client để gọi API

### Navigation
- **@react-navigation/native 7.1.26** - Navigation library
- **@react-navigation/native-stack 7.9.0** - Stack navigator
- **@react-navigation/bottom-tabs 7.9.0** - Bottom tab navigator

### Features & Libraries
- **expo-camera ~17.0.10** - Camera và QR code scanning
- **react-native-nfc-manager 3.17.2** - NFC tag scanning
- **expo-linear-gradient ~15.0.8** - Gradient UI components
- **react-native-svg 15.12.1** - SVG support
- **@expo/vector-icons ^15.0.3** - Icon library

## 📁 Cấu trúc thư mục

```
ISUMS_MOBILE_APP/
├── src/
│   ├── features/
│   │   ├── screens/                    # Màn hình dùng chung        
│   │   ├── tenant/                    # Tính năng dành cho role Người thuê (tenant)
│   │   ├── staff/                     # Tính năng dành cho role Thợ kỹ thuật (Staff)
│   │   ├── modal/                      # Màn hình chung: Camera (QR + NFC)
│   │   └──
│   ├── shared/
│   │   ├── components/                # Footer navigator, Header
│   │   ├── hooks/                     # useUserProfile, index
│   │   ├── services/                  # deviceData, keycloakAuth, userApi, authData
│   │   ├── api/                       # axiosClient
│   │   ├── theme/                     # icon, LogoIcon
│   │   ├── types/                     # Định nghĩa TypeScript (index, api)
│   │   ├── styles/                    # headerStyles, iconStyles, footerStyles
│   │   ├── i18n/                      # Đa ngôn ngữ
│   │   ├── utils/                     # Hàm tiện ích
│   │   └──
│   ├── navigation/                   # Cấu hình Stack + Tab navigator
│   ├── store/                        # Zustand (useAuthStore)
├── assets/                           # Hình ảnh, icon, splash (favicon, logob...)
├── docs/                             # Tài liệu (ISUMS_SPECIFICATION.md, ...)
├── App.tsx                           # Component gốc
├── index.ts                          # Entry point
├── app.json                          # Cấu hình Expo
├── package.json
└── tsconfig.json
```

## 🛠️ Cài đặt và chạy

### Yêu cầu hệ thống

- Node.js (phiên bản 18 trở lên)
- npm hoặc yarn
- Expo CLI (hoặc Expo Go app trên điện thoại)

### Cài đặt

1. **Clone repository:**
   ```bash
   git clone https://github.com/Management-System-for-Rental-SEP490/ISUMS_MOBILE_APP.git
   cd ISUMS_MOBILE_APP
   ```

2. **Cài đặt dependencies:**
   ```bash
   npm install
   ```

3. **Chạy ứng dụng:**
   ```bash
   npm start
   ```
   
   Hoặc chạy trên platform cụ thể:
   ```bash
   npm run android    # Chạy trên Android (yêu cầu Android Studio)
   npm run ios        # Chạy trên iOS (chỉ macOS, yêu cầu Xcode)
   npm run web        # Chạy trên web browser
   ```

4. **Quét QR code với Expo Go:**
   - Mở app **Expo Go** trên điện thoại
   - Quét QR code hiển thị trên terminal
   - Ứng dụng sẽ tự động load

   **Lưu ý:** Một số tính năng như Camera và NFC chỉ hoạt động trên thiết bị thật, không hoạt động trên Expo Go. Để test đầy đủ, cần build development build.

## 📱 Screenshots

<div align="center">
  <img src="./assets/logob.png" alt="App Icon" width="150"/>
  <p><em>App Icon</em></p>
</div>

## 🎯 Tính năng chính

### Xác thực và Phân quyền
- ✅ Đăng nhập / Đăng ký / Quên mật khẩu
- ✅ Hỗ trợ nhiều vai trò: **tenant**, **Staff**, **Landlord**, **Manager**
- ✅ Quản lý session với token và refresh token

### Quản lý Thiết bị
- ✅ Quét QR code và NFC tag để nhận diện thiết bị, báo cáo sự cố
- ✅ Xem chi tiết thiết bị (điện, nước)
- ✅ Quản lý trạng thái thiết bị (active, inactive, maintenance)

### Theo dõi Tiêu thụ
- ✅ Dashboard hiển thị tổng quan

### Hóa đơn và Báo cáo
- ✅ Xem hóa đơn bảo trì
- ✅ Báo cáo tiêu thụ, sự cố

### Quản lý Cư dân
- ✅ Danh sách cư dân trong căn hộ
- ✅ Thông tin chi tiết cư dân

### Tính năng khác
- ✅ Lịch (Calendar)
- ✅ Thông báo (Notifications)
- ✅ Hồ sơ người dùng (User Profile)

### Kỹ thuật
- ✅ Cấu trúc project rõ ràng, dễ bảo trì (Feature-based architecture)
- ✅ TypeScript cho type safety
- ✅ Zustand cho state management
- ✅ React Query cho quản lý API calls và caching
- ✅ Hỗ trợ Android, iOS và Web
- ✅ Safe Area handling cho các thiết bị có notch
- ✅ Custom icons và theme system

## 🔐 Permissions

Ứng dụng yêu cầu các quyền sau trên Android:
- `CAMERA` - Để quét QR code và chụp ảnh thiết bị
- `NFC` - Để đọc NFC tags từ thiết bị

## 📚 Tài liệu tham khảo

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [React Navigation](https://reactnavigation.org/)
- [Expo Camera](https://docs.expo.dev/versions/latest/sdk/camera/)
- [React Native NFC Manager](https://github.com/whitedogg13/react-native-nfc-manager)

## 👤 Tác giả

**Anh Khoa FPT**

- GitHub: [@Anh-Khoa-fpt](https://github.com/Anh-Khoa-fpt)

## 📄 License

This project is private and for educational purposes only.

---
