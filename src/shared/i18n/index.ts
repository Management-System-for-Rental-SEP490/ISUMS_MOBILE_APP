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
          },
          "report_button": "Báo cáo sự cố"
      },
      "ticket": {
          "title": "Tạo phiếu báo cáo",
          "device_info_title": "Thông tin thiết bị",
          "title_label": "Tiêu đề",
          "title_placeholder": "Nhập tiêu đề báo cáo",
          "description_label": "Mô tả",
          "description_placeholder": "Mô tả chi tiết về sự cố hoặc yêu cầu bảo trì...",
          "priority_label": "Mức độ ưu tiên",
          "priority_low": "Thấp",
          "priority_medium": "Trung bình",
          "priority_high": "Cao",
          "submit_button": "Gửi báo cáo",
          "validation_error_title": "Lỗi xác thực",
          "title_required": "Vui lòng nhập tiêu đề",
          "description_required": "Vui lòng nhập mô tả",
          "success_title": "Thành công",
          "success_message": "Phiếu báo cáo đã được gửi thành công"
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
      },
      "consumption": {
        "area_all": "Tất cả",
        "area_kitchen": "Bếp",
        "area_living_room": "Phòng khách",
        "area_bedroom": "Phòng ngủ",
        "area_bathroom": "Phòng tắm",
        "chart_title_electric": "Tiêu thụ điện theo tuần",
        "chart_title_water": "Tiêu thụ nước theo tuần",
        "unit_kwh": "kWh",
        "unit_m3": "m³",
        "period_week": "Tuần này",
        "day_label": "T{{n}}",
        "chart_title_pie": "Phân bố theo khu vực"
      },
      "notification": {
        "empty": "Chưa có thông báo nào",
        "type_ticket": "Phiếu bảo trì",
        "type_electric": "Cảnh báo điện",
        "type_water": "Cảnh báo nước",
        "msg_ticket_received_title": "Phiếu bảo trì #{{id}} đã được tiếp nhận",
        "msg_ticket_received_body": "Kỹ thuật viên sẽ liên hệ trong 24h.",
        "msg_ticket_done_title": "Phiếu #{{id}} đã hoàn thành",
        "msg_ticket_done_body": "Thiết bị máy lạnh phòng khách đã được sửa xong.",
        "msg_ticket_assigned_title": "Phiếu #{{id}} đã được phân công",
        "msg_ticket_assigned_body": "Nhân viên sẽ đến kiểm tra theo lịch hẹn.",
        "msg_electric_anomaly_title": "Cảnh báo tiêu thụ điện bất thường",
        "msg_electric_anomaly_body": "Khu vực Bếp: mức tiêu thụ cao hơn {{percent}}% so với bình thường. AI đề xuất kiểm tra thiết bị.",
        "msg_water_anomaly_title": "Cảnh báo phát hiện rò rỉ nước",
        "msg_water_anomaly_body": "AI phát hiện bất thường tại Phòng tắm. Vui lòng kiểm tra ngay.",
        "time_minutes": "{{n}} phút trước",
        "time_hours": "{{n}} giờ trước",
        "time_days": "{{n}} ngày trước"
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
          },
          "report_button": "Report Issue"
      },
      "ticket": {
          "title": "Create Report Ticket",
          "device_info_title": "Device Information",
          "title_label": "Title",
          "title_placeholder": "Enter report title",
          "description_label": "Description",
          "description_placeholder": "Describe the issue or maintenance request in detail...",
          "priority_label": "Priority",
          "priority_low": "Low",
          "priority_medium": "Medium",
          "priority_high": "High",
          "submit_button": "Submit Report",
          "validation_error_title": "Validation Error",
          "title_required": "Please enter a title",
          "description_required": "Please enter a description",
          "success_title": "Success",
          "success_message": "Report ticket has been submitted successfully"
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
      },
      "consumption": {
        "area_all": "All",
        "area_kitchen": "Kitchen",
        "area_living_room": "Living room",
        "area_bedroom": "Bedroom",
        "area_bathroom": "Bathroom",
        "chart_title_electric": "Weekly electricity consumption",
        "chart_title_water": "Weekly water consumption",
        "unit_kwh": "kWh",
        "unit_m3": "m³",
        "period_week": "This week",
        "day_label": "Day {{n}}",
        "chart_title_pie": "Distribution by area"
      },
      "notification": {
        "empty": "No notifications yet",
        "type_ticket": "Maintenance ticket",
        "type_electric": "Electric alert",
        "type_water": "Water alert",
        "msg_ticket_received_title": "Ticket #{{id}} has been received",
        "msg_ticket_received_body": "A technician will contact you within 24 hours.",
        "msg_ticket_done_title": "Ticket #{{id}} completed",
        "msg_ticket_done_body": "Living room AC unit has been repaired.",
        "msg_ticket_assigned_title": "Ticket #{{id}} has been assigned",
        "msg_ticket_assigned_body": "Staff will come for inspection as scheduled.",
        "msg_electric_anomaly_title": "Unusual electricity consumption alert",
        "msg_electric_anomaly_body": "Kitchen area: consumption {{percent}}% higher than usual. AI suggests checking devices.",
        "msg_water_anomaly_title": "Water leak detection alert",
        "msg_water_anomaly_body": "AI detected anomaly in Bathroom. Please check as soon as possible.",
        "time_minutes": "{{n}} min ago",
        "time_hours": "{{n}} hours ago",
        "time_days": "{{n}} days ago"
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
          },
          "report_button": "問題を報告"
      },
      "ticket": {
          "title": "レポートチケットを作成",
          "device_info_title": "デバイス情報",
          "title_label": "タイトル",
          "title_placeholder": "レポートタイトルを入力",
          "description_label": "説明",
          "description_placeholder": "問題やメンテナンス要求について詳しく説明してください...",
          "priority_label": "優先度",
          "priority_low": "低",
          "priority_medium": "中",
          "priority_high": "高",
          "submit_button": "レポートを送信",
          "validation_error_title": "検証エラー",
          "title_required": "タイトルを入力してください",
          "description_required": "説明を入力してください",
          "success_title": "成功",
          "success_message": "レポートチケットが正常に送信されました"
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
      },
      "consumption": {
        "area_all": "すべて",
        "area_kitchen": "キッチン",
        "area_living_room": "リビング",
        "area_bedroom": "寝室",
        "area_bathroom": "浴室",
        "chart_title_electric": "週間電力消費",
        "chart_title_water": "週間水道消費",
        "unit_kwh": "kWh",
        "unit_m3": "m³",
        "period_week": "今週",
        "day_label": "{{n}}日",
        "chart_title_pie": "エリア別割合"
      },
      "notification": {
        "empty": "通知はありません",
        "type_ticket": "保守チケット",
        "type_electric": "電気アラート",
        "type_water": "水道アラート",
        "msg_ticket_received_title": "チケット #{{id}} を受付ました",
        "msg_ticket_received_body": "24時間以内に技術者が連絡します。",
        "msg_ticket_done_title": "チケット #{{id}} 完了",
        "msg_ticket_done_body": "リビングのエアコンが修理されました。",
        "msg_ticket_assigned_title": "チケット #{{id}} が割り当てられました",
        "msg_ticket_assigned_body": "スタッフが予定通り点検に伺います。",
        "msg_electric_anomaly_title": "電力消費異常の警告",
        "msg_electric_anomaly_body": "キッチン: 通常より{{percent}}%高い消費。AIが機器確認を推奨しています。",
        "msg_water_anomaly_title": "漏水検知の警告",
        "msg_water_anomaly_body": "浴室で異常を検知しました。至急ご確認ください。",
        "time_minutes": "{{n}}分前",
        "time_hours": "{{n}}時間前",
        "time_days": "{{n}}日前"
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