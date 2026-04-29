# Hướng dẫn cài đặt môi trường & chạy app Android (Tenant + Staff) trên Windows

Tài liệu áp dụng cho **hai repo**:

- **Tenant:** `ISUMS_MOBILE_APP`
- **Staff:** `ISUMS_STAFF_APP`

Luồng chung giống nhau; chỉ khác **thư mục dự án** khi `cd` và chạy lệnh.

---

## Phần 1 — Cài Node.js (cho React Native / Expo)

1. Tải **Node.js LTS** từ trang chính thức:  
   https://nodejs.org/  
   (khuyến nghị bản **LTS**, ví dụ 20.x hoặc 22.x).

2. Chạy installer, tick **Add to PATH** (nếu có).

3. Mở **PowerShell** hoặc **CMD** mới, kiểm tra:

   ```powershell
   node -v
   npm -v
   ```

4. (Tuỳ chọn) Công cụ CLI Expo:

   ```powershell
   npm install -g expo-cli
   ```

   Hoặc chỉ dùng `npx` trong từng repo (không cần cài global).

---

## Phần 2 — Cài JDK 17

Dự án Android/React Native trong repo **dùng JDK 17**. Nên cài **JDK 17** riêng và trỏ **`JAVA_HOME`** tới đó để Gradle/Expo không nhầm sang JDK khác.

### 2.1 Tải JDK 17

Chọn **một** nguồn sau (đều có bản Windows x64 installer):

| Nguồn | Gợi ý |
|--------|--------|
| **Eclipse Temurin 17 (LTS)** | https://adoptium.net/temurin/releases/?version=17 — phổ biến, miễn phí |
| **Microsoft Build of OpenJDK 17** | https://learn.microsoft.com/java/openjdk/download — gần với môi trường Windows |
| **Oracle JDK 17** | https://www.oracle.com/java/technologies/downloads/#java17 — cần tài khoản Oracle nếu chọn gói có điều khoản riêng |

Tải **Windows x64** → **JDK** (không chỉ JRE). Trong installer, ghi nhớ thư mục cài (mặc định thường kiểu `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot` hoặc `C:\Program Files\Microsoft\jdk-17.x.x`).

### 2.2 Biến môi trường `JAVA_HOME` và PATH

1. Mở **Settings → System → About → Advanced system settings → Environment Variables** (hoặc tìm “biến môi trường” trên Windows).

2. **User** hoặc **System** → **New**:
   - Tên: `JAVA_HOME`
   - Giá trị: thư mục **gốc** của JDK (chứa `bin`, `lib`), ví dụ:  
     `C:\Program Files\Eclipse Adoptium\jdk-17.0.13.11-hotspot`

3. Trong biến **`Path`** (User hoặc System), **thêm** (nếu chưa có):

   ```text
   %JAVA_HOME%\bin
   ```

4. **Đóng hết** terminal/PowerShell/IDE rồi mở lại (biến môi trường mới mới có hiệu lực).

### 2.3 Kiểm tra

PowerShell **mới**:

```powershell
java -version
javac -version
```

Kết quả nên có dạng **`17`** (ví dụ `openjdk version "17.0.x"`). Nếu vẫn ra bản 11/21 → PATH đang trỏ JDK khác; chỉnh lại hoặc đưa `%JAVA_HOME%\bin` lên trên trong `Path`.

### 2.4 Android Studio và JDK 17

Android Studio có **JDK đi kèm** (JBR). Nếu build từ CLI/Gradle vẫn lỗi kiểu “Unsupported class file major version” hoặc sai Java:

- **File → Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK**: chọn **JDK 17** (có thể chọn **Download JDK…** và chọn version 17), hoặc trỏ tới thư mục JDK 17 đã cài ở trên.

---

## Phần 3 — Cài Android Studio

1. Tải **Android Studio**:  
   https://developer.android.com/studio  

2. Trong **Android Studio Setup Wizard**, cài:

   - **Android SDK**
   - **Android SDK Platform**
   - **Android Virtual Device** (AVD) nếu dùng emulator

3. Mở Android Studio → **More Actions** → **SDK Manager** (hoặc **File → Settings → Appearance & Behavior → System Settings → Android SDK**).

4. Tab **SDK Platforms**: chọn ít nhất một **Android API** (ví dụ API 34 hoặc 35 — khớp với `compileSdkVersion` trong project nếu build báo thiếu).

5. Tab **SDK Tools**: đảm bảo có:

   - Android SDK Build-Tools  
   - Android SDK Platform-Tools  
   - Android Emulator (nếu chạy máy ảo)

6. **Ghi nhớ đường dẫn SDK** — xem Phần 4.

---

## Phần 4 — Lấy đường dẫn Android SDK

### Cách 1 — Trong Android Studio (chuẩn nhất)

**Settings → Languages & Frameworks → Android SDK**  

Ở trường **Android SDK Location** là đường dẫn cần dùng.

Thường gặp trên Windows:

```text
C:\Users\<TênUser>\AppData\Local\Android\Sdk
```

### Cách 2 — Biến môi trường (nếu đã set)

PowerShell:

```powershell
[System.Environment]::GetEnvironmentVariable("ANDROID_HOME", "User")
[System.Environment]::GetEnvironmentVariable("ANDROID_HOME", "Machine")
```

Nếu có giá trị, đó cũng là thư mục SDK (hoặc parent — thực tế `ANDROID_HOME` trỏ thẳng tới thư mục `Sdk`).

### (Khuyến nghị) Set `ANDROID_HOME` cho Gradle/Expo

**User** environment variable:

- Tên: `ANDROID_HOME`  
- Giá trị: đường dẫn SDK (ví dụ `C:\Users\YourName\AppData\Local\Android\Sdk`)

Sau đó **đóng và mở lại** terminal.

---

## Phần 5 — Chuẩn bị từng repo (Tenant và Staff)

Lặp lại **cho mỗi** app (đổi đường dẫn cho đúng máy bạn).

### 4.1 Cài dependency

```powershell
cd D:\Documents\TaiLieu\FPT_9th\Capstone\ISUMS_MOBILE_APP
npm install
```

```powershell
cd D:\Documents\TaiLieu\FPT_9th\Capstone\ISUMS_STAFF_APP
npm install
```

### 4.2 Chạy build Android lần đầu (để thấy lỗi / nhắc SDK)

Trong thư mục **root** của project (có `package.json` và `android/`):

```powershell
cd D:\Documents\TaiLieu\FPT_9th\Capstone\ISUMS_MOBILE_APP
npx expo run:android
```

(Tương tự cho Staff: `...\ISUMS_STAFF_APP`.)

Nếu báo không tìm thấy SDK hoặc Gradle không resolve SDK → làm bước Phần 6.

---

## Phần 6 — Tạo `android/local.properties`

Gradle đọc file này để biết **SDK** nằm đâu (file thường **không commit**).

1. Vào thư mục `android` của **đúng** app:

   - Tenant: `ISUMS_MOBILE_APP\android\`
   - Staff: `ISUMS_STAFF_APP\android\`

2. Tạo file tên **`local.properties`** (cùng cấp `build.gradle` của module app).

3. Thêm **một dòng** `sdk.dir=...`:

**Dùng dấu xẹt `/` (Gradle chấp nhận trên Windows, tránh escape phức tạp):**

```properties
sdk.dir=C:/Users/YourName/AppData/Local/Android/Sdk
```

Thay `YourName` và đường dẫn cho khớp **SDK Location** trong Android Studio.

**Hoặc** dùng backslash (phải escape):

```properties
sdk.dir=C\:\\Users\\YourName\\AppData\\Local\\Android\\Sdk
```

4. Lưu file (UTF-8, không BOM nếu có thể).

---

## Phần 7 — Chạy lại

Từ root project:

```powershell
npx expo run:android
```

- Có **thiết bị USB** (bật USB debugging) hoặc **emulator** đang chạy.

---

## Checklist nhanh

| Bước | Việc |
|------|------|
| 1 | Node LTS + `node -v` |
| 2 | JDK 17 + `JAVA_HOME` + `java -version` (17) |
| 3 | Android Studio + SDK + Platform Tools |
| 4 | Copy đường dẫn SDK từ SDK Manager |
| 5 | `npm install` trong từng repo |
| 6 | `npx expo run:android` — ghi nhận lỗi SDK nếu có |
| 7 | Tạo `android/local.properties` với `sdk.dir=...` |
| 8 | `npx expo run:android` lại |

---

## Ghi chú

- Hai app là **hai package khác nhau** → có thể cài **cả hai** trên cùng một máy/emulator (không trùng bundle id).
- Nếu vẫn lỗi sau khi có `local.properties`, xem lại **Phần 2** (`JAVA_HOME`, `java -version`, Gradle JDK trong Android Studio).
- Emulator: **Device Manager** trong Android Studio để tạo/start AVD trước khi `run:android`.
