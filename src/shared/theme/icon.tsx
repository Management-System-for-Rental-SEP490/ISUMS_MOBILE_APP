import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { IconProps } from '../types';
import { LogoHomeIcon } from './LogoIcon';
import Ionicons from '@expo/vector-icons/build/Ionicons';


const Icons = {
  /** MaterialIcons — tránh Entypo/FontAwesome không vẽ trên một số bản Android (ô Home trống). */
  home: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="home" size={size} color={color} />
  ),
  user: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="person" size={size} color={color} />
  ),
  menu: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <AntDesign name="menu" size={size} color={color} />
  ),
  water: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="hand-holding-water" size={size} color={color} />
  ),
  electric: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="electrical-services" size={size} color={color} />
  ),
  /** Tiêu thụ (điện + nước) — biểu đồ sử dụng. */
  consumption: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="insights" size={size} color={color} />
  ),
  search: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="search" size={size} color={color} />
  ),
  /** Tra cứu thiết bị (quét QR). */
  scanLookup: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="qr-code" size={size} color={color} />
  ),
  /** Quét NFC (thiết bị). */
  nfc: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="nfc" size={size} color={color} />
  ),
  /** Chụp ảnh (ticket, báo cáo). */
  photoCamera: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="photo-camera" size={size} color={color} />
  ),
  /** Thư viện ảnh. */
  photoLibrary: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="photo-library" size={size} color={color} />
  ),
  /** Sửa chữa / báo sự cố (ticket). */
  build: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="build" size={size} color={color} />
  ),
  /** Hỏi đáp (ticket). */
  helpOutline: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="help-outline" size={size} color={color} />
  ),
  /** Mô tả nội dung (card chi tiết ticket). */
  subject: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="subject" size={size} color={color} />
  ),
  /** Thông tin thiết bị / nhân sự (card chi tiết ticket). */
  infoOutline: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="info-outline" size={size} color={color} />
  ),
  contract: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="file-contract" size={size} color={color} />
  ),
  /** Hợp đồng điện tử / tài liệu giao nhiệm vụ (Material — đồng bộ hệ icon). */
  eContract: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="assignment" size={size} color={color} />
  ),
  /** Nút mở PDF hợp đồng. */
  pictureAsPdf: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="picture-as-pdf" size={size} color={color} />
  ),
  brain: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="brain" size={size} color={color} />
  ),
  people: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome6 name="people-group" size={size} color={color} />
  ),
  logoHome: ({ size = 24 }: IconProps = {}) => <LogoHomeIcon width={size} height={size} />,
  calendar: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <AntDesign name="calendar" size={size} color={color} />
  ),
  notification: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome name="bell" size={size} color={color} />
  ),
  /** Vị trí / khu vực (thông báo IoT). */
  place: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="place" size={size} color={color} />
  ),
  mail: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="mail" size={size} color={color} />
  ),
  call: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="call" size={size} color={color} />
  ),
  shield: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="shield-alt" size={size} color={color} />
  ),
  chevronForward: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <Ionicons name="chevron-forward" size={size} color={color} />
  ),
  chevronBack: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <Ionicons name="chevron-back" size={size} color={color} />
  ),
  /** Đồng hồ (giờ gửi ticket). */
  clock: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <Ionicons name="time-outline" size={size} color={color} />
  ),
  chevronDown: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <Ionicons name="chevron-down" size={size} color={color} />
  ),
  chevronUp: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <Ionicons name="chevron-up" size={size} color={color} />
  ),
  logOut: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <Ionicons name="log-out-outline" size={size} color={color} />
  ),
  /** Icon cho tab Ticket (danh sách phiếu báo sự cố của Staff) */
  ticket: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="ticket-alt" size={size} color={color} />
  ),
  /** Icon dấu cộng (thêm danh mục / thêm thiết bị). */
  plus: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <AntDesign name="plus" size={size} color={color} />
  ),
  /** Hóa đơn / thanh toán (tenant). */
  invoice: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="file-invoice-dollar" size={size} color={color} />
  ),
  /** Ví — nút thanh toán trên danh sách ticket. */
  wallet: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="account-balance-wallet" size={size} color={color} />
  ),
  /** Icon cảnh báo (dấu hiệu sự cố/alert). */
  warning: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="warning" size={size} color={color} />
  ),
  /** Icon X để xóa nội dung (dùng cho nút clear ô tìm kiếm). */
  close: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <AntDesign name="close" size={size} color={color} />
  ),
};

export default Icons;