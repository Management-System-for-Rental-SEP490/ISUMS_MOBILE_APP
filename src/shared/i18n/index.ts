import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageDetectorAsyncModule } from 'i18next';

// Module phát hiện ngôn ngữ (đọc/ghi từ AsyncStorage)
const languageDetector: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  detect: (callback) => {
    AsyncStorage.getItem('user-language') //// Gọi AsyncStorage để lấy giá trị đã lưu với key là 'user-language'
      .then((language) => {
        if (language) {
          callback(language); // // Gọi callback để báo cho i18next biết: "Hãy dùng ngôn ngữ này!"
        } else {
          callback('vi'); //nếu không có giá trị thì gọi callback với giá trị là 'vi'
        }
      })
      .catch((error) => {
        console.log('Lỗi đọc ngôn ngữ', error);
        callback('vi');
      });
  },
  init: () => {},
  // i18next gọi hàm này mỗi khi người dùng đổi ngôn ngữ (i18n.changeLanguage)
  cacheUserLanguage: async (language) => {
    try {
      // Lưu mã ngôn ngữ vào bộ nhớ máy với key 'user-language'
      await AsyncStorage.setItem('user-language', language);
    } catch (error) {
      console.log('Lỗi lưu ngôn ngữ', error);
    }
  },
};

// Định nghĩa các bản dịch
const resources = {
  vi: {
    translation: {
      "login_btn": "Đăng nhập với tài khoản ISUMS",
      "welcome": "Chào mừng bạn đến với ISUMS",
      "description": "Vui lòng đăng nhập để tiếp tục sử dụng ứng dụng",
      "common": {
          "back": "Quay lại",
          "no_data": "Không có dữ liệu",
          "loading": "Đang tải...",
          "error": "Lỗi",
          "success": "Thành công",
          "close": "Đóng",
          "cancel": "Hủy",
          "try_again": "Thử lại",
          "save": "Lưu"
      },
      "device_detail": {
          "title": "Chi tiết thiết bị",
          "device_name": "Tên thiết bị",
          "id": "ID",
          "type": "Loại",
          "location": "Vị trí",
          "status": "Trạng thái",
          "nfc_tag_id": "NFC Tag ID",
          "technical_info": "Thông tin kỹ thuật",
          "serial_number": "Số sê-ri",
          "manufacturer": "Nhà sản xuất",
          "model": "Model",
          "installation_date": "Ngày lắp đặt",
          "type_label": {
              "electric": "Điện",
              "water": "Nước",
              "other": "Khác"
          },
          "status_label": {
              "active": "Đang hoạt động",
              "inactive": "Ngừng hoạt động",
              "maintenance": "Đang bảo trì",
              "pending": "Chờ xử lý"
          }
      },
      "tenants": {
          "title": "Quản lý cư dân thuê",
          "subtitle": "Theo dõi hợp đồng, thông tin liên hệ và lịch sử thanh toán của từng cư dân."
      },
      "onboarding": {
          "slide1": {
              "title": "Quản lý thiết bị NFC",
              "desc": "Quét thẻ NFC trên thiết bị để xem thông tin chi tiết và gửi báo cáo hư hỏng ngay lập tức."
          },
          "slide2": {
              "title": "Thanh toán Dịch vụ",
              "desc": "Hỗ trợ thanh toán trực tuyến nhanh chóng sau khi quy trình bảo trì thiết bị hoàn tất thành công."
          },
          "slide3": {
              "title": "Giám sát Điện & Nước",
              "desc": "Hệ thống IoT theo dõi chỉ số tiêu thụ theo thời gian thực và cảnh báo ngay nếu có bất thường."
          },
          "skip": "Bỏ qua",
          "start": "Bắt đầu ngay",
          "continue": "Tiếp tục"
      },
      "camera": {
          "loading": "Đang tải...",
          "no_permission": "Không có quyền truy cập camera",
          "grant_permission": "Cấp quyền",
          "qr_mode": "QR Code",
          "nfc_mode": "NFC",
          "nfc_scanning": "Đang quét NFC...",
          "nfc_instruction": "Đưa thẻ NFC vào điện thoại",
          "nfc_wait": "Vui lòng đợi trong khi hệ thống đọc thẻ NFC",
          "nfc_start": "Nhấn nút bên dưới để bắt đầu quét NFC",
          "nfc_btn": "Bắt đầu quét NFC",
          "nfc_scanning_indicator": "Đang quét...",
          "timeout_title": "Hết thời gian",
          "timeout_msg": "Không tìm thấy thẻ NFC. Vui lòng thử lại.",
          "error_title": "Lỗi",
          "read_error": "Không thể đọc thẻ NFC. Vui lòng thử lại.",
          "id_error": "Không thể đọc ID từ thẻ NFC.",
          "not_found_title": "Không tìm thấy",
          "not_found_nfc": "Không tìm thấy thiết bị với NFC ID: {{id}}",
          "not_found_qr": "Không tìm thấy thiết bị với mã: {{id}}",
          "rescan": "Quét lại"
      },
      "billing": {
          "title": "Bảng điều khiển Billing",
          "subtitle": "Tổng quan hóa đơn, thanh toán và các khoản phí phụ trợ dành cho chủ nhà."
      },
      "screens": {
          "water": "Nước",
          "electric": "Điện",
          "calendar": "Lịch",
          "notification": "Thông báo"
      },
      "nav": {
        "Dashboard": "Quét",
        "ElectricUsage": "Điện",
        "WaterUsage": "Nước",
        "Billing": "Hóa đơn",
        "Tenants": "Cư dân",
        "Profile": "Hồ sơ",
        "Calendar": "Lịch",
        "Notification": "Thông báo"
      },
      "profile": {
        "title": "Hồ sơ cá nhân",
        "contact_info": "Thông tin liên hệ",
        "email": "Email",
        "phone": "Số điện thoại",
        "security": "Bảo mật",
        "change_password": "Đổi mật khẩu",
        "change_password_desc": "Cập nhật mật khẩu bảo vệ tài khoản",
        "app_settings": "Ứng dụng",
        "notifications": "Thông báo",
        "notifications_desc": "Cài đặt nhận tin",
        "logout": "Đăng xuất",
        "logout_confirm_title": "Đăng xuất",
        "logout_confirm_msg": "Bạn có chắc chắn muốn đăng xuất không?",
        "cancel": "Hủy",
        "role_Technical": "Kỹ thuật viên",
        "role_Tenant": "Cư dân",
        "role_manager": "Quản lý",
        "role_landlord": "Chủ nhà",
        "role_guest": "Khách"
      },
      "home": {
        "welcome_role": "Bạn đang là {{role}}",
        "loading_data": "Đang tải dữ liệu...",
        "house_info": {
            "address": "Địa chỉ:",
            "contract": "Hợp đồng:",
            "duration": "Thời hạn:",
            "status": "Trạng thái:",
            "status_active": "Đang hiệu lực"
        },
        "device_list": {
            "title": "Danh sách thiết bị ({{count}})",
            "status": {
                 "active": "Hoạt động",
                 "maintenance": "Bảo trì",
                 "inactive": "Ngừng hĐ"
            }
        }
      }
    }
  },
  en: {
    translation: {
      "login_btn": "Login with ISUMS account",
      "welcome": "Welcome to ISUMS",
      "description": "Please login to continue using the application",
      "common": {
          "back": "Back",
          "no_data": "No data",
          "loading": "Loading...",
          "error": "Error",
          "success": "Success",
          "close": "Close",
          "cancel": "Cancel",
          "try_again": "Try again",
          "save": "Save"
      },
      "device_detail": {
          "title": "Device Details",
          "device_name": "Device Name",
          "id": "ID",
          "type": "Type",
          "location": "Location",
          "status": "Status",
          "nfc_tag_id": "NFC Tag ID",
          "technical_info": "Technical Information",
          "serial_number": "Serial Number",
          "manufacturer": "Manufacturer",
          "model": "Model",
          "installation_date": "Installation Date",
          "type_label": {
              "electric": "Electric",
              "water": "Water",
              "other": "Other"
          },
          "status_label": {
              "active": "Active",
              "inactive": "Inactive",
              "maintenance": "Maintenance",
              "pending": "Pending"
          }
      },
      "tenants": {
          "title": "Tenant Management",
          "subtitle": "Track contracts, contact info, and payment history for each tenant."
      },
      "onboarding": {
          "slide1": {
              "title": "NFC Device Management",
              "desc": "Scan NFC tags on devices to view details and report issues instantly."
          },
          "slide2": {
              "title": "Service Payment",
              "desc": "Support quick online payment after maintenance process is completed successfully."
          },
          "slide3": {
              "title": "Utility Monitoring",
              "desc": "IoT system tracks consumption in real-time and alerts immediately if anomalies occur."
          },
          "skip": "Skip",
          "start": "Get Started",
          "continue": "Continue"
      },
      "camera": {
          "loading": "Loading...",
          "no_permission": "No camera access",
          "grant_permission": "Grant Permission",
          "qr_mode": "QR Code",
          "nfc_mode": "NFC",
          "nfc_scanning": "Scanning NFC...",
          "nfc_instruction": "Hold NFC tag near phone",
          "nfc_wait": "Please wait while reading NFC tag",
          "nfc_start": "Press button below to start NFC scan",
          "nfc_btn": "Start NFC Scan",
          "nfc_scanning_indicator": "Scanning...",
          "timeout_title": "Timeout",
          "timeout_msg": "NFC tag not found. Please try again.",
          "error_title": "Error",
          "read_error": "Cannot read NFC tag. Please try again.",
          "id_error": "Cannot read ID from NFC tag.",
          "not_found_title": "Not Found",
          "not_found_nfc": "Device not found with NFC ID: {{id}}",
          "not_found_qr": "Device not found with code: {{id}}",
          "rescan": "Rescan"
      },
      "billing": {
          "title": "Billing Dashboard",
          "subtitle": "Overview of invoices, payments, and auxiliary fees for landlords."
      },
      "screens": {
          "water": "Water",
          "electric": "Electric",
          "calendar": "Calendar",
          "notification": "Notification"
      },
      "nav": {
        "Dashboard": "Scan",
        "ElectricUsage": "Electric",
        "WaterUsage": "Water",
        "Billing": "Billing",
        "Tenants": "Tenants",
        "Profile": "Profile",
        "Calendar": "Calendar",
        "Notification": "Notification"
      },
      "profile": {
        "title": "My Profile",
        "contact_info": "Contact Information",
        "email": "Email",
        "phone": "Phone Number",
        "security": "Security",
        "change_password": "Change Password",
        "change_password_desc": "Update your account password",
        "app_settings": "Application",
        "notifications": "Notifications",
        "notifications_desc": "Message settings",
        "logout": "Logout",
        "logout_confirm_title": "Logout",
        "logout_confirm_msg": "Are you sure you want to logout?",
        "cancel": "Cancel",
        "role_Technical": "Technician",
        "role_Tenant": "Tenant",
        "role_manager": "Manager",
        "role_landlord": "Landlord",
        "role_guest": "Guest"
      },
      "home": {
        "welcome_role": "You are a {{role}}",
        "loading_data": "Loading data...",
        "house_info": {
            "address": "Address:",
            "contract": "Contract:",
            "duration": "Duration:",
            "status": "Status:",
            "status_active": "Active"
        },
        "device_list": {
            "title": "Device List ({{count}})",
            "status": {
                 "active": "Active",
                 "maintenance": "Maintenance",
                 "inactive": "Inactive"
            }
        }
      }
    }
  },
  ja: {
    translation: {
      "login_btn": "ISUMSアカウントでログイン",
      "welcome": "ISUMSへようこそ",
      "description": "アプリケーションの使用を続けるにはログインしてください",
      "common": {
          "back": "戻る",
          "no_data": "データなし",
          "loading": "読み込み中...",
          "error": "エラー",
          "success": "成功",
          "close": "閉じる",
          "cancel": "キャンセル",
          "try_again": "再試行",
          "save": "保存"
      },
      "device_detail": {
          "title": "デバイス詳細",
          "device_name": "デバイス名",
          "id": "ID",
          "type": "タイプ",
          "location": "場所",
          "status": "ステータス",
          "nfc_tag_id": "NFCタグID",
          "technical_info": "技術情報",
          "serial_number": "シリアル番号",
          "manufacturer": "メーカー",
          "model": "モデル",
          "installation_date": "設置日",
          "type_label": {
              "electric": "電気",
              "water": "水",
              "other": "その他"
          },
          "status_label": {
              "active": "稼働中",
              "inactive": "停止中",
              "maintenance": "メンテナンス中",
              "pending": "保留中"
          }
      },
      "tenants": {
          "title": "居住者管理",
          "subtitle": "各居住者の契約、連絡先情報、支払い履歴を追跡します。"
      },
      "onboarding": {
          "slide1": {
              "title": "NFCデバイス管理",
              "desc": "デバイス上のNFCタグをスキャンして詳細を表示し、問題を即座に報告します。"
          },
          "slide2": {
              "title": "サービス支払い",
              "desc": "メンテナンスプロセスが正常に完了した後、迅速なオンライン支払いをサポートします。"
          },
          "slide3": {
              "title": "電気・水道監視",
              "desc": "IoTシステムがリアルタイムで消費量を追跡し、異常が発生した場合は即座に警告します。"
          },
          "skip": "スキップ",
          "start": "今すぐ開始",
          "continue": "次へ"
      },
      "camera": {
          "loading": "読み込み中...",
          "no_permission": "カメラへのアクセス権がありません",
          "grant_permission": "許可する",
          "qr_mode": "QRコード",
          "nfc_mode": "NFC",
          "nfc_scanning": "NFCスキャン中...",
          "nfc_instruction": "NFCタグを携帯電話に近づけてください",
          "nfc_wait": "NFCタグを読み取っています...",
          "nfc_start": "下のボタンを押してNFCスキャンを開始",
          "nfc_btn": "NFCスキャン開始",
          "nfc_scanning_indicator": "スキャン中...",
          "timeout_title": "タイムアウト",
          "timeout_msg": "NFCタグが見つかりません。もう一度お試しください。",
          "error_title": "エラー",
          "read_error": "NFCタグを読み取れません。もう一度お試しください。",
          "id_error": "NFCタグからIDを読み取れません。",
          "not_found_title": "見つかりません",
          "not_found_nfc": "NFC ID: {{id}} のデバイスが見つかりません",
          "not_found_qr": "コード: {{id}} のデバイスが見つかりません",
          "rescan": "再スキャン"
      },
      "billing": {
          "title": "請求ダッシュボード",
          "subtitle": "家主向けの請求書、支払い、および付随費用の概要。"
      },
      "screens": {
          "water": "水",
          "electric": "電気",
          "calendar": "カレンダー",
          "notification": "通知"
      },
      "nav": {
        "Dashboard": "スキャン",
        "ElectricUsage": "電気",
        "WaterUsage": "水",
        "Billing": "請求書",
        "Tenants": "居住者",
        "Profile": "プロフィール",
        "Calendar": "カレンダー",
        "Notification": "通知"
      },
      "profile": {
        "title": "プロフィール",
        "contact_info": "連絡先情報",
        "email": "メール",
        "phone": "電話番号",
        "security": "セキュリティ",
        "change_password": "パスワード変更",
        "change_password_desc": "アカウントのパスワードを更新",
        "app_settings": "アプリ設定",
        "notifications": "通知",
        "notifications_desc": "受信設定",
        "logout": "ログアウト",
        "logout_confirm_title": "ログアウト",
        "logout_confirm_msg": "本当にログアウトしますか？",
        "cancel": "キャンセル",
        "role_Technical": "技術者",
        "role_Tenant": "居住者",
        "role_manager": "管理者",
        "role_landlord": "大家",
        "role_guest": "ゲスト"
      },
      "home": {
        "welcome_role": "あなたは{{role}}です",
        "loading_data": "データを読み込んでいます...",
        "house_info": {
            "address": "住所:",
            "contract": "契約:",
            "duration": "期間:",
            "status": "状態:",
            "status_active": "有効"
        },
        "device_list": {
            "title": "デバイス一覧 ({{count}})",
            "status": {
                 "active": "アクティブ",
                 "maintenance": "メンテナンス中",
                 "inactive": "停止中"
            }
        }
      }
    }
  }
};

i18n
  .use(languageDetector) // Sử dụng bộ phát hiện ngôn ngữ
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false 
    },
    react: {
      useSuspense: false // Tránh lỗi suspense trên Android cũ
    }
  });

export default i18n;