# 🏠 ISUMS - Mobile Application

<div align="center">
  <img src="./assets/iconRetanlHouse.png" alt="ISUMS Logo" width="200" height="200"/>
  
  **Capstone Project - Mobile Application**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB?logo=react)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-~54.0.29-000020?logo=expo)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
</div>

---

## 📋 Mô tả

ISUMS là ứng dụng mobile được xây dựng bằng React Native và Expo Framework, phục vụ cho đồ án tốt nghiệp.

## 🚀 Công nghệ sử dụng

- **React Native** - Framework phát triển ứng dụng mobile
- **Expo** - Toolchain và platform cho React Native
- **TypeScript** - Ngôn ngữ lập trình với type safety
- **Zustand** - State management (quản lý state dùng chung)
- **React Query (@tanstack/react-query)** - Quản lý server state và API calls
- **Axios** - HTTP client để gọi API

## 📁 Cấu trúc thư mục

```
ISUMS/
├── src/                    # Thư mục chứa code chính
│   ├── screens/           # Các màn hình (Home, Profile, Login...)
│   ├── components/        # Các component tái sử dụng (Button, Card...)
│   ├── navigation/         # Cấu hình điều hướng (Stack, Tab Navigator...)
│   ├── services/          # Code gọi API (React Query hooks)
│   ├── stores/             # Zustand stores (quản lý state)
│   ├── hooks/              # Custom hooks (dùng React Query ở đây)
│   ├── types/              # Định nghĩa TypeScript types
│   └── utils/              # Các hàm tiện ích (formatDate, validation...)
├── assets/                 # Hình ảnh, icons, fonts...
│   ├── icon.png           # Icon chính của app
│   ├── iconRetanlHouse.png # Icon app (custom)
│   ├── splash-icon.png    # Splash screen
│   └── ...
├── App.tsx                 # Component gốc của ứng dụng
├── index.ts                # Entry point
├── app.json                # Cấu hình Expo
├── package.json            # Dependencies và scripts
└── tsconfig.json           # Cấu hình TypeScript
```

## 🛠️ Cài đặt và chạy

### Yêu cầu hệ thống

- Node.js (phiên bản 18 trở lên)
- npm hoặc yarn
- Expo CLI (hoặc Expo Go app trên điện thoại)

### Cài đặt

1. **Clone repository:**
   ```bash
   git clone https://github.com/Anh-Khoa-fpt/ISUMS_APP.git
   cd ISUMS_APP/ISUMS
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
   npm run android    # Chạy trên Android
   npm run ios        # Chạy trên iOS (chỉ macOS)
   npm run web        # Chạy trên web browser
   ```

4. **Quét QR code:**
   - Mở app **Expo Go** trên điện thoại
   - Quét QR code hiển thị trên terminal
   - Ứng dụng sẽ tự động load

## 📱 Screenshots

<div align="center">
  <img src="./assets/iconRetanlHouse.png" alt="App Icon" width="150"/>
  <p><em>App Icon</em></p>
</div>

## 🎯 Tính năng chính

- ✅ Cấu trúc project rõ ràng, dễ bảo trì
- ✅ TypeScript cho type safety
- ✅ Zustand cho state management
- ✅ React Query cho quản lý API calls
- ✅ Hỗ trợ Android, iOS và Web

## 📚 Tài liệu tham khảo

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)
- [React Query Documentation](https://tanstack.com/query/latest)

## 👤 Tác giả

**Anh Khoa FPT**

- GitHub: [@Anh-Khoa-fpt](https://github.com/Anh-Khoa-fpt)

## 📄 License

This project is private and for educational purposes only.

---

<div align="center">
  Made with ❤️ using React Native & Expo
</div>
