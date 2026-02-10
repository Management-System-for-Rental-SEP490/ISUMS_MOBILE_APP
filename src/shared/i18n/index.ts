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
      "loading": "Đang đăng nhập...",
      "nav": {
        "Dashboard": "Trang chủ",
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
        "role_technical": "Kỹ thuật viên",
        "role_tenant": "Cư dân",
        "role_manager": "Quản lý",
        "role_landlord": "Chủ nhà",
        "role_guest": "Khách"
      },
      "home": {
        "welcome_role": "Bạn đang là {{role}}"
      }
    }
  },
  en: {
    translation: {
      "login_btn": "Login with ISUMS account",
      "welcome": "Welcome to ISUMS",
      "description": "Please login to continue using the application",
      "loading": "Logging in...",
      "nav": {
        "Dashboard": "Home",
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
        "role_technical": "Technician",
        "role_tenant": "Tenant",
        "role_manager": "Manager",
        "role_landlord": "Landlord",
        "role_guest": "Guest"
      },
      "home": {
        "welcome_role": "You are a {{role}}"
      }
    }
  },
  ja: {
    translation: {
      "login_btn": "ISUMSアカウントでログイン",
      "welcome": "ISUMSへようこそ",
      "description": "アプリケーションの使用を続けるにはログインしてください",
      "loading": "ログイン中...",
      "nav": {
        "Dashboard": "ホーム",
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
        "role_technical": "技術者",
        "role_tenant": "居住者",
        "role_manager": "管理者",
        "role_landlord": "大家",
        "role_guest": "ゲスト"
      },
      "home": {
        "welcome_role": "あなたは{{role}}です"
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