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
          "lookup_no_device_nfc": "Không có thiết bị nào gắn mã NFC này.",
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
        "tenants": "Cư dân",
        "Profile": "Hồ sơ",
        "Calendar": "Lịch",
        "Notification": "Thông báo",
        "Ticket": "Ticket"
      },
      "staff_home": {
        "schedule_title": "Lịch làm việc tuần này",
        "schedule_summary_title": "Tóm tắt lịch có việc",
        "schedule_no_slots": "Tuần này chưa có ca nào",
        "schedule_col_time": "Thời gian",
        "schedule_col_building": "Căn nhà",
        "schedule_col_task": "Công việc",
        "assets_by_building_title": "Thiết bị / Asset theo căn nhà",
        "buildings_title": "Các căn nhà",
        "buildings_error": "Không tải được danh sách căn nhà. Vui lòng thử lại.",
        "all_devices_title": "Tất cả thiết bị",
        "all_devices_category_all": "Tất cả",
        "all_devices_items_placeholder": "Danh sách thiết bị sẽ hiển thị khi có API items.",
        "all_devices_no_items": "Không có thiết bị nào.",
        "all_devices_status_available": "Sẵn sàng",
        "all_devices_status_in_use": "Đang sử dụng",
        "all_devices_status_disposed": "Đã thanh lý",
        "all_devices_status_other": "{{status}}",
        "asset_condition_label": "Tình trạng: {{percent}}%",
        "nfc_assigned": "Đã gán NFC",
        "nfc_not_assigned": "Chưa gán NFC",
        "asset_status": {
          "active": "Hoạt động",
          "maintenance": "Bảo trì",
          "inactive": "Ngừng",
          "pending": "Chờ xử lý"
        },
        "add_menu_open": "Mở menu thêm",
        "add_menu_create_category": "Tạo danh mục",
        "add_menu_create_device": "Tạo thiết bị",
        "add_menu_assign_nfc": "Gán NFC"
      },
      "staff_category": {
        "title": "Tạo danh mục thiết bị",
        "name_label": "Tên danh mục",
        "name_placeholder": "Ví dụ: Máy lạnh, Bóng đèn",
        "compensation_label": "Phần trăm bồi thường (%)",
        "compensation_placeholder": "0–100",
        "description_label": "Mô tả",
        "description_placeholder": "Mô tả chi tiết về danh mục",
        "submit": "Tạo danh mục",
        "success_message": "Tạo danh mục thành công.",
        "error_message": "Có lỗi. Vui lòng thử lại."
      },
      "staff_category_edit": {
        "title": "Chỉnh sửa danh mục thiết bị",
        "submit": "Cập nhật",
        "success_message": "Đã cập nhật danh mục."
      },
      "staff_category_list": {
        "title": "Danh sách danh mục thiết bị",
        "empty": "Chưa có danh mục nào.",
        "error": "Không tải được danh sách danh mục. Vui lòng thử lại.",
        "compensation": "Bồi thường: {{percent}}%"
      },
      "staff_item_list": {
        "title": "Danh sách thiết bị",
        "empty": "Chưa có thiết bị nào.",
        "error": "Không tải được danh sách thiết bị. Vui lòng thử lại.",
        "category_other": "Khác",
        "condition": "Tình trạng: {{percent}}%",
        "status_available": "Sẵn sàng",
        "status_in_use": "Đang sử dụng",
        "status_disposed": "Đã thanh lý"
      },
      "staff_item_create": {
        "title": "Thêm thiết bị",
        "house_label": "Căn nhà",
        "category_label": "Danh mục thiết bị",
        "display_name_label": "Tên hiển thị",
        "display_name_placeholder": "Ví dụ: Máy lạnh phòng khách",
        "serial_number_label": "Số serial",
        "serial_number_placeholder": "Ví dụ: AC-2025-003",
        "nfc_id_label": "Mã NFC (tùy chọn)",
        "nfc_id_placeholder": "Để trống nếu chưa gán",
        "condition_label": "Tình trạng (%)",
        "status_label": "Trạng thái",
        "status_available": "Sẵn sàng",
        "status_in_use": "Đang sử dụng",
        "status_disposed": "Đã thanh lý",
        "submit": "Thêm thiết bị",
        "success_message": "Đã thêm thiết bị.",
        "error_message": "Có lỗi. Vui lòng thử lại."
      },
      "staff_item_edit": {
        "title": "Chỉnh sửa thiết bị",
        "submit": "Cập nhật",
        "success_message": "Đã cập nhật thiết bị.",
        "delete_btn": "Xóa thiết bị",
        "delete_confirm_title": "Xác nhận xóa",
        "delete_confirm_message": "Bạn có chắc muốn xóa thiết bị này? Thao tác có thể không hoàn tác được.",
        "nfc_duplicate_title": "Mã NFC đã được gán",
        "nfc_duplicate_message": "Mã NFC này đang được gán cho thiết bị \"{{name}}\". Mỗi mã chỉ được gán cho một thiết bị.",
        "remove_nfc_btn": "Gỡ gán NFC",
        "remove_nfc_confirm_title": "Gỡ thẻ NFC",
        "remove_nfc_confirm_message": "Bạn có chắc muốn gỡ thẻ NFC này khỏi thiết bị?",
        "remove_nfc_success": "Đã gỡ thẻ NFC khỏi thiết bị.",
        "remove_nfc_error": "Không thể gỡ thẻ NFC. Vui lòng thử lại.",
        "error_100_percent_in_use": "Thiết bị có tình trạng 100% không thể để trạng thái Đang sử dụng (IN_USE)."
      },
      "staff_item_description": {
        "title": "Thông tin thiết bị",
        "edit_btn": "Chỉnh sửa"
      },
      "staff_notification": {
        "tenant_sent_ticket_title": "Có ticket mới từ người thuê",
        "tenant_sent_ticket_body": "Người thuê tại {{house}} đã gửi ticket #{{id}}. Vui lòng xem và xử lý.",
        "schedule_updated_title": "Lịch làm việc đã được cập nhật",
        "schedule_updated_body": "Lịch tuần này có thay đổi. Vui lòng kiểm tra lại lịch của bạn.",
        "ticket_assigned_title": "Bạn được phân công ticket #{{id}}",
        "ticket_assigned_body": "Ticket đã được gán cho bạn. Hãy liên hệ người thuê và sắp xếp lịch xử lý.",
        "inspection_reminder_title": "Nhắc kiểm tra định kỳ",
        "inspection_reminder_body": "Đến hạn kiểm tra định kỳ tại {{building}}. Vui lòng thực hiện theo lịch.",
        "system_maintenance_title": "Bảo trì hệ thống",
        "system_maintenance_body": "Hệ thống sẽ bảo trì vào cuối tuần. Ứng dụng có thể gián đoạn ngắn."
      },
      "staff_ticket_list": {
        "title": "Danh sách Ticket",
        "empty": "Chưa có ticket nào",
        "tenant": "Người thuê",
        "today": "Hôm nay",
        "yesterday": "Hôm qua",
        "days_ago": "{{n}} ngày trước",
        "priority_high": "Cao",
        "priority_medium": "Trung bình",
        "priority_low": "Thấp",
        "status_pending": "Chờ nhận",
        "status_assigned": "Đã phân công",
        "status_scheduled": "Đã đặt lịch",
        "status_in_progress": "Đang xử lý",
        "status_completed": "Hoàn thành",
        "status_cancelled": "Đã hủy"
      },
      "staff_ticket_detail": {
        "status": "Trạng thái",
        "priority": "Mức ưu tiên",
        "title_label": "Tiêu đề",
        "description": "Mô tả",
        "device": "Thiết bị",
        "building": "Căn nhà",
        "tenant": "Người thuê",
        "created_at": "Ngày tạo",
        "accept_ticket": "Nhận ticket",
        "choose_slot_modal_title": "Chọn khung giờ trong lịch tuần này",
        "choose_slot_modal_hint": "Chỉ hiển thị khung giờ bạn đã đăng ký và còn trống. Chọn một ca để xử lý ticket này.",
        "choose_slot_no_free": "Không có khung giờ trống trong tuần này. Các ca đã có ticket sẽ không hiển thị.",
        "confirm_slot": "Xác nhận"
      },
      "staff_calendar": {
        "this_week_title": "Lịch tuần này",
        "no_slots_today": "Không có ca trong ngày",
        "day_off_label": "Nghỉ",
        "next_week_register_title": "Đăng ký lịch tuần sau",
        "next_week_register_hint": "Chọn khung giờ phù hợp để đăng ký. Sau khi duyệt, lịch sẽ hiển thị ở tuần tới.",
        "register_slot": "Đăng ký",
        "registered": "Đã đăng ký"
      },
      "staff_building_detail": {
        "devices_title": "Thiết bị ({{count}})",
        "no_devices": "Chưa có thiết bị nào",
        "devices_load_error": "Không tải được danh sách thiết bị.",
        "category_other": "Khác",
        "assign_nfc": "Gán mã NFC",
        "status_active": "Hoạt động",
        "status_maintenance": "Bảo trì",
        "status_inactive": "Ngừng",
        "status_pending": "Chờ xử lý",
        "house_status_available": "Còn trống",
        "house_status_rented": "Đã cho thuê",
        "house_status_other": "{{status}}",
        "functional_areas_title": "Khu vực trong nhà",
        "functional_areas_empty": "Chưa có khu vực nào",
        "functional_area_floor": "Tầng {{floor}}",
        "area_type_LIVINGROOM": "Phòng khách",
        "area_type_KITCHEN": "Bếp",
        "area_type_BATHROOM": "Phòng tắm",
        "area_type_HALLWAY": "Hành lang",
        "area_type_BEDROOM": "Phòng ngủ",
        "area_type_OTHER": "Khác"
      },
      "staff_nfc": {
        "nfc_id_not_assigned": "Mã NFC này chưa được gán cho thiết bị nào.",
        "assign_to_empty_device": "Gán vào thiết bị trống",
        "confirm_assign_title": "Xác nhận gán NFC",
        "confirm_assign_message": "Gán mã NFC \"{{nfcId}}\" vào thiết bị \"{{displayName}}\"?",
        "assign_success": "Gán NFC thành công.",
        "assign_error": "Không thể gán NFC. Vui lòng thử lại.",
        "select_device_to_assign": "Chọn thiết bị để gán mã NFC",
        "no_empty_devices": "Không có thiết bị nào đang trống (chưa gán NFC).",
        "device_found": "Đã tìm thấy thiết bị",
        "section_house_category": "{{houseName}} · {{categoryName}}",
        "house_other": "Khác",
        "duplicate_title": "Mã NFC đã được gán",
        "duplicate_message": "Mã NFC này đang được gán cho thiết bị \"{{name}}\". Mỗi thẻ chỉ được gán cho một thiết bị."
      },
      "staff_book_schedule_modal": {
        "title": "Đăng ký ngày nghỉ",
        "hint": "Mặc định bạn làm 8h–18h mỗi ngày. Chọn ngày muốn nghỉ trong tuần này.",
        "day_label": "Chọn ngày nghỉ",
        "already_off": "Nghỉ",
        "confirm_off": "Đăng ký nghỉ ngày này",
        "confirm_remove_off": "Bỏ đăng ký nghỉ"
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
          "technical_info": "technical Information",
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
          "title": "tenant Management",
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
          "lookup_no_device_nfc": "No device is assigned to this NFC code.",
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
        "tenants": "tenants",
        "Profile": "Profile",
        "Calendar": "Calendar",
        "Notification": "Notification",
        "Ticket": "Ticket"
      },
      "staff_home": {
        "schedule_title": "This week's work schedule",
        "schedule_summary_title": "When you have work (summary)",
        "schedule_no_slots": "No slots this week",
        "schedule_col_time": "Time",
        "schedule_col_building": "Building",
        "schedule_col_task": "Task",
        "assets_by_building_title": "Assets by building",
        "buildings_title": "Buildings",
        "buildings_error": "Could not load buildings. Please try again.",
        "all_devices_title": "All devices",
        "all_devices_category_all": "All",
        "all_devices_items_placeholder": "Device list will appear when items API is available.",
        "all_devices_no_items": "No devices.",
        "all_devices_status_available": "Available",
        "all_devices_status_in_use": "In use",
        "all_devices_status_disposed": "Disposed",
        "all_devices_status_other": "{{status}}",
        "asset_condition_label": "Condition: {{percent}}%",
        "nfc_assigned": "NFC assigned",
        "nfc_not_assigned": "No NFC",
        "asset_status": {
          "active": "Active",
          "maintenance": "Maintenance",
          "inactive": "Inactive",
          "pending": "Pending"
        },
        "add_menu_open": "Open add menu",
        "add_menu_create_category": "Create category",
        "add_menu_create_device": "Create device",
        "add_menu_assign_nfc": "Assign NFC"
      },
      "staff_category": {
        "title": "Create asset category",
        "name_label": "Category name",
        "name_placeholder": "e.g. Air conditioner, Light bulb",
        "compensation_label": "Compensation percent (%)",
        "compensation_placeholder": "0–100",
        "description_label": "Description",
        "description_placeholder": "Detailed description of the category",
        "submit": "Create category",
        "success_message": "Category created successfully.",
        "error_message": "Something went wrong. Please try again."
      },
      "staff_category_edit": {
        "title": "Edit asset category",
        "submit": "Update",
        "success_message": "Category updated."
      },
      "staff_category_list": {
        "title": "Asset categories",
        "empty": "No categories yet.",
        "error": "Could not load categories. Please try again.",
        "compensation": "Compensation: {{percent}}%"
      },
      "staff_item_list": {
        "title": "Device list",
        "empty": "No devices yet.",
        "error": "Could not load devices. Please try again.",
        "category_other": "Other",
        "condition": "Condition: {{percent}}%",
        "status_available": "Available",
        "status_in_use": "In use",
        "status_disposed": "Disposed"
      },
      "staff_item_create": {
        "title": "Add device",
        "house_label": "House",
        "category_label": "Category",
        "display_name_label": "Display name",
        "display_name_placeholder": "e.g. Living room AC",
        "serial_number_label": "Serial number",
        "serial_number_placeholder": "e.g. AC-2025-003",
        "nfc_id_label": "NFC ID (optional)",
        "nfc_id_placeholder": "Leave empty if not assigned",
        "condition_label": "Condition (%)",
        "status_label": "Status",
        "status_available": "Available",
        "status_in_use": "In use",
        "status_disposed": "Disposed",
        "submit": "Add device",
        "success_message": "Device added.",
        "error_message": "Something went wrong. Please try again."
      },
      "staff_item_edit": {
        "title": "Edit device",
        "submit": "Update",
        "success_message": "Device updated.",
        "delete_btn": "Delete device",
        "delete_confirm_title": "Confirm delete",
        "delete_confirm_message": "Are you sure you want to delete this device? This action may not be reversible.",
        "nfc_duplicate_title": "NFC already assigned",
        "nfc_duplicate_message": "This NFC ID is already assigned to device \"{{name}}\". Each NFC can only be linked to one device.",
        "remove_nfc_btn": "Detach NFC",
        "remove_nfc_confirm_title": "Detach NFC tag",
        "remove_nfc_confirm_message": "Are you sure you want to detach this NFC tag from the device?",
        "remove_nfc_success": "NFC tag detached from device.",
        "remove_nfc_error": "Failed to detach NFC tag. Please try again.",
        "error_100_percent_in_use": "Device with 100% condition cannot be set to In Use status."
      },
      "staff_item_description": {
        "title": "Device information",
        "edit_btn": "Edit"
      },
      "staff_notification": {
        "tenant_sent_ticket_title": "New ticket from tenant",
        "tenant_sent_ticket_body": "A tenant at {{house}} submitted ticket #{{id}}. Please review and handle.",
        "schedule_updated_title": "Work schedule updated",
        "schedule_updated_body": "This week's schedule has changed. Please check your schedule.",
        "ticket_assigned_title": "You were assigned ticket #{{id}}",
        "ticket_assigned_body": "The ticket has been assigned to you. Contact the tenant and schedule the repair.",
        "inspection_reminder_title": "Inspection reminder",
        "inspection_reminder_body": "Scheduled inspection due at {{building}}. Please complete as planned.",
        "system_maintenance_title": "System maintenance",
        "system_maintenance_body": "System maintenance is scheduled for the weekend. The app may be briefly unavailable."
      },
      "staff_ticket_list": {
        "title": "Ticket list",
        "empty": "No tickets yet",
        "tenant": "tenant",
        "today": "Today",
        "yesterday": "Yesterday",
        "days_ago": "{{n}} days ago",
        "priority_high": "High",
        "priority_medium": "Medium",
        "priority_low": "Low",
        "status_pending": "Pending",
        "status_assigned": "Assigned",
        "status_scheduled": "Scheduled",
        "status_in_progress": "In progress",
        "status_completed": "Completed",
        "status_cancelled": "Cancelled"
      },
      "staff_ticket_detail": {
        "status": "Status",
        "priority": "Priority",
        "title_label": "Title",
        "description": "Description",
        "device": "Device",
        "building": "Building",
        "tenant": "tenant",
        "created_at": "Created at",
        "accept_ticket": "Accept ticket",
        "choose_slot_modal_title": "Choose time slot from this week's schedule",
        "choose_slot_modal_hint": "Only registered, free slots are shown. Select one to handle this ticket.",
        "choose_slot_no_free": "No free slots this week. Slots already assigned to a ticket are hidden.",
        "confirm_slot": "Confirm"
      },
      "staff_calendar": {
        "this_week_title": "This week's schedule",
        "no_slots_today": "No slots this day",
        "day_off_label": "Off",
        "next_week_register_title": "Register schedule for next week",
        "next_week_register_hint": "Pick time slots that work for you. After approval, they will show in next week's schedule.",
        "register_slot": "Register",
        "registered": "Registered"
      },
      "staff_building_detail": {
        "devices_title": "Devices ({{count}})",
        "no_devices": "No devices yet",
        "devices_load_error": "Could not load devices.",
        "category_other": "Other",
        "assign_nfc": "Assign NFC",
        "status_active": "Active",
        "status_maintenance": "Maintenance",
        "status_inactive": "Inactive",
        "status_pending": "Pending",
        "house_status_available": "Available",
        "house_status_rented": "Rented",
        "house_status_other": "{{status}}",
        "functional_areas_title": "Functional areas",
        "functional_areas_empty": "No functional areas",
        "functional_area_floor": "Floor {{floor}}",
        "area_type_LIVINGROOM": "Living room",
        "area_type_KITCHEN": "Kitchen",
        "area_type_BATHROOM": "Bathroom",
        "area_type_HALLWAY": "Hallway",
        "area_type_BEDROOM": "Bedroom",
        "area_type_OTHER": "Other"
      },
      "staff_nfc": {
        "nfc_id_not_assigned": "This NFC ID is not assigned to any device.",
        "assign_to_empty_device": "Assign to empty device",
        "confirm_assign_title": "Confirm assign NFC",
        "confirm_assign_message": "Assign NFC \"{{nfcId}}\" to device \"{{displayName}}\"?",
        "assign_success": "NFC assigned successfully.",
        "assign_error": "Failed to assign NFC. Please try again.",
        "select_device_to_assign": "Select a device to assign NFC",
        "no_empty_devices": "No devices without NFC.",
        "device_found": "Device found",
        "section_house_category": "{{houseName}} · {{categoryName}}",
        "house_other": "Other",
        "duplicate_title": "NFC already assigned",
        "duplicate_message": "This NFC ID is already assigned to device \"{{name}}\". Each NFC can only be linked to one device."
      },
      "staff_book_schedule_modal": {
        "title": "Register day off",
        "hint": "By default you work 8am–6pm every day. Select the day you want to take off this week.",
        "day_label": "Select day off",
        "already_off": "Off",
        "confirm_off": "Register this day off",
        "confirm_remove_off": "Cancel day off"
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
        "role_tenant": "tenant",
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
          "lookup_no_device_nfc": "このNFCコードが割り当てられたデバイスはありません。",
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
        "tenants": "居住者",
        "Profile": "プロフィール",
        "Calendar": "カレンダー",
        "Notification": "通知",
        "Ticket": "チケット"
      },
      "staff_home": {
        "schedule_title": "今週の勤務表",
        "schedule_summary_title": "勤務あり（まとめ）",
        "schedule_no_slots": "今週の予定はありません",
        "schedule_col_time": "時間",
        "schedule_col_building": "建物",
        "schedule_col_task": "作業",
        "assets_by_building_title": "建物別資産",
        "buildings_title": "建物一覧",
        "buildings_error": "建物一覧を読み込めませんでした。もう一度お試しください。",
        "all_devices_title": "全デバイス",
        "all_devices_category_all": "すべて",
        "all_devices_items_placeholder": "アイテムAPI連携後にデバイス一覧を表示します。",
        "all_devices_no_items": "デバイスがありません。",
        "all_devices_status_available": "利用可能",
        "all_devices_status_in_use": "使用中",
        "all_devices_status_disposed": "廃棄済み",
        "all_devices_status_other": "{{status}}",
        "asset_condition_label": "状態: {{percent}}%",
        "nfc_assigned": "NFC割り当て済み",
        "nfc_not_assigned": "NFC未割り当て",
        "asset_status": {
          "active": "稼働中",
          "maintenance": "メンテ中",
          "inactive": "停止",
          "pending": "保留"
        },
        "add_menu_open": "追加メニューを開く",
        "add_menu_create_category": "カテゴリを作成",
        "add_menu_create_device": "デバイスを作成",
        "add_menu_assign_nfc": "NFCを割り当て"
      },
      "staff_category": {
        "title": "資産カテゴリを作成",
        "name_label": "カテゴリ名",
        "name_placeholder": "例：エアコン、電球",
        "compensation_label": "補償率（%）",
        "compensation_placeholder": "0–100",
        "description_label": "説明",
        "description_placeholder": "カテゴリの詳細説明",
        "submit": "カテゴリを作成",
        "success_message": "カテゴリを作成しました。",
        "error_message": "エラーが発生しました。もう一度お試しください。"
      },
      "staff_category_edit": {
        "title": "資産カテゴリを編集",
        "submit": "更新",
        "success_message": "カテゴリを更新しました。"
      },
      "staff_category_list": {
        "title": "資産カテゴリ一覧",
        "empty": "カテゴリがまだありません。",
        "error": "カテゴリ一覧を読み込めませんでした。もう一度お試しください。",
        "compensation": "補償率: {{percent}}%"
      },
      "staff_item_list": {
        "title": "デバイス一覧",
        "empty": "デバイスがまだありません。",
        "error": "デバイス一覧を読み込めませんでした。もう一度お試しください。",
        "category_other": "その他",
        "condition": "状態: {{percent}}%",
        "status_available": "利用可能",
        "status_in_use": "使用中",
        "status_disposed": "廃棄済み"
      },
      "staff_item_create": {
        "title": "デバイスを追加",
        "house_label": "建物",
        "category_label": "カテゴリ",
        "display_name_label": "表示名",
        "display_name_placeholder": "例：リビングエアコン",
        "serial_number_label": "シリアル番号",
        "serial_number_placeholder": "例：AC-2025-003",
        "nfc_id_label": "NFC ID（任意）",
        "nfc_id_placeholder": "未割り当ての場合は空欄",
        "condition_label": "状態（%）",
        "status_label": "ステータス",
        "status_available": "利用可能",
        "status_in_use": "使用中",
        "status_disposed": "廃棄済み",
        "submit": "追加",
        "success_message": "デバイスを追加しました。",
        "error_message": "エラーが発生しました。もう一度お試しください。"
      },
      "staff_item_edit": {
        "title": "デバイスを編集",
        "submit": "更新",
        "success_message": "デバイスを更新しました。",
        "delete_btn": "デバイスを削除",
        "delete_confirm_title": "削除の確認",
        "delete_confirm_message": "このデバイスを削除してもよろしいですか？元に戻せない場合があります。",
        "nfc_duplicate_title": "NFCは既に割り当て済みです",
        "nfc_duplicate_message": "このNFC IDはすでにデバイス「{{name}}」に割り当てられています。1つのNFCは1つのデバイスにのみ紐づけできます。",
        "remove_nfc_btn": "NFCを解除",
        "remove_nfc_confirm_title": "NFCタグの解除",
        "remove_nfc_confirm_message": "このNFCタグをデバイスから解除してもよろしいですか？",
        "remove_nfc_success": "NFCタグをデバイスから解除しました。",
        "remove_nfc_error": "NFCタグの解除に失敗しました。もう一度お試しください。",
        "error_100_percent_in_use": "状態が100%のデバイスは「使用中」に設定できません。"
      },
      "staff_item_description": {
        "title": "デバイス情報",
        "edit_btn": "編集"
      },
      "staff_notification": {
        "tenant_sent_ticket_title": "入居者からチケットが届きました",
        "tenant_sent_ticket_body": "{{house}}の入居者がチケット #{{id}} を送信しました。確認して対応してください。",
        "schedule_updated_title": "勤務表が更新されました",
        "schedule_updated_body": "今週のスケジュールに変更があります。勤務表をご確認ください。",
        "ticket_assigned_title": "チケット #{{id}} が割り当てられました",
        "ticket_assigned_body": "チケットがあなたに割り当てられました。入居者に連絡し、修理の日程を調整してください。",
        "inspection_reminder_title": "点検リマインダー",
        "inspection_reminder_body": "{{building}} の定期点検の時期です。予定通り実施してください。",
        "system_maintenance_title": "システムメンテナンス",
        "system_maintenance_body": "週末にシステムメンテナンスを予定しています。アプリが一時利用できなくなる場合があります。"
      },
      "staff_ticket_list": {
        "title": "チケット一覧",
        "empty": "チケットはありません",
        "tenant": "入居者",
        "today": "今日",
        "yesterday": "昨日",
        "days_ago": "{{n}}日前",
        "priority_high": "高",
        "priority_medium": "中",
        "priority_low": "低",
        "status_pending": "未対応",
        "status_assigned": "割当済",
        "status_scheduled": "予定済",
        "status_in_progress": "対応中",
        "status_completed": "完了",
        "status_cancelled": "キャンセル"
      },
      "staff_ticket_detail": {
        "status": "ステータス",
        "priority": "優先度",
        "title_label": "タイトル",
        "description": "説明",
        "device": "デバイス",
        "building": "建物",
        "tenant": "入居者",
        "created_at": "作成日時",
        "accept_ticket": "チケットを受ける",
        "choose_slot_modal_title": "今週の勤務から時間帯を選択",
        "choose_slot_modal_hint": "登録済みで空いている時間帯のみ表示されます。このチケットに対応する時間帯を選んでください。",
        "choose_slot_no_free": "今週は空き時間がありません。チケット割当済みの時間帯は表示されません。",
        "confirm_slot": "確認"
      },
      "staff_calendar": {
        "this_week_title": "今週の勤務表",
        "no_slots_today": "この日の予定はありません",
        "day_off_label": "休",
        "next_week_register_title": "来週の勤務登録",
        "next_week_register_hint": "都合の良い時間帯を選択して登録します。承認後、来週のスケジュールに表示されます。",
        "register_slot": "登録",
        "registered": "登録済み"
      },
      "staff_building_detail": {
        "devices_title": "デバイス ({{count}})",
        "no_devices": "デバイスがありません",
        "devices_load_error": "デバイス一覧を読み込めませんでした。",
        "category_other": "その他",
        "assign_nfc": "NFCを割り当て",
        "status_active": "稼働中",
        "status_maintenance": "メンテ中",
        "status_inactive": "停止",
        "status_pending": "保留",
        "house_status_available": "空き",
        "house_status_rented": "賃貸中",
        "house_status_other": "{{status}}",
        "functional_areas_title": "家内の機能エリア",
        "functional_areas_empty": "機能エリアがありません",
        "functional_area_floor": "{{floor}}階",
        "area_type_LIVINGROOM": "リビング",
        "area_type_KITCHEN": "キッチン",
        "area_type_BATHROOM": "浴室",
        "area_type_HALLWAY": "廊下",
        "area_type_BEDROOM": "寝室",
        "area_type_OTHER": "その他"
      },
      "staff_nfc": {
        "nfc_id_not_assigned": "このNFC IDはどのデバイスにも割り当てられていません。",
        "assign_to_empty_device": "空きデバイスに割り当て",
        "confirm_assign_title": "NFC割り当ての確認",
        "confirm_assign_message": "NFC「{{nfcId}}」をデバイス「{{displayName}}」に割り当てますか？",
        "assign_success": "NFCの割り当てに成功しました。",
        "assign_error": "NFCの割り当てに失敗しました。もう一度お試しください。",
        "select_device_to_assign": "NFCを割り当てるデバイスを選択",
        "no_empty_devices": "NFC未割り当てのデバイスがありません。",
        "device_found": "デバイスが見つかりました",
        "section_house_category": "{{houseName}} · {{categoryName}}",
        "house_other": "その他",
        "duplicate_title": "NFCは既に割り当て済みです",
        "duplicate_message": "このNFC IDはすでにデバイス「{{name}}」に割り当てられています。1つのNFCは1つのデバイスにのみ紐づけできます。"
      },
      "staff_book_schedule_modal": {
        "title": "休暇登録",
        "hint": "通常は毎日8時〜18時勤務です。今週休みにしたい日を選んでください。",
        "day_label": "休暇日を選択",
        "already_off": "休",
        "confirm_off": "この日を休暇に登録",
        "confirm_remove_off": "休暇を取り消す"
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