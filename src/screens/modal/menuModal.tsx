import { useEffect, useRef, useState } from "react";
import { Animated, Modal, TouchableOpacity, Dimensions, Text } from "react-native";
import menuStyles from "../../styles/modal/menuStyles";
import { useMenuStore } from "../../stores/useAuthStore";
/**
 * Dòng code sau:
 *   const { width: screenWidth } = Dimensions.get("window");
 * 
 * - Dimensions là đối tượng của React Native, cho phép lấy thông tin về kích thước màn hình thiết bị.
 * - Hàm get("window") trả về một object chứa thông tin về chiều rộng (width), chiều cao (height) của màn hình hiện tại.
 * - Cú pháp `{ width: screenWidth } = ...` sử dụng destructuring assignment để lấy thuộc tính width từ object trả về 
 *   và gán giá trị đó vào biến có tên là screenWidth.
 * => Kết quả: screenWidth sẽ chứa giá trị chiều rộng của màn hình thiết bị, rất hữu ích để căn chỉnh/đặt vị trí/lập trình responsive cho các phần tử UI.
 */

const { width: screenWidth } = Dimensions.get("window");

const MenuModal = () => {
  const { visible, close } = useMenuStore();
  // gán giá trị của menu vị trí ngoài màn hình(mặc định nằm bên phải màn hình) vì giá trị khởi tạo translateX = screenWidth
  const translateX = useRef(new Animated.Value(screenWidth)).current;
  // kiểm soát việc modal có thực sự tồn tại trên giao diện hay không, đặc biệt để hỗ trợ animation chuyển cảnh đóng/mở một cách tự nhiên, đẹp mắt mà không bị "biến mất" đột ngột khi tắt modal.
  const [isMounted, setIsMounted] = useState(visible);
  /**
   * Bạn sẽ dùng useEffect để:
   *  - Lưu dữ liệu (ví dụ: vào storage, hoặc gửi network request)
   *  - Chạy hiệu ứng, trigger animation, hoặc lắng nghe event bên ngoài
   *  - Bất cứ "hành động phụ" nào muốn nó diễn ra ngay khi giá trị/thành phần render lại hoặc khi có 1 dữ liệu cụ thể thay đổi.
   */
  /**
   * 
   * useEffect(() => { ... }, [visible, translateX]);
   * 
   * - Đây là một React Hook (useEffect), chạy "side-effect" mỗi khi modal hiển thị hoặc ẩn đi.
   * - Tham số thứ nhất là một hàm thực thi mỗi khi một trong những giá trị trong mảng dependency (tham số thứ hai) thay đổi.
   * - [visible, translateX]: useEffect sẽ chạy lại mỗi khi giá trị visible (trạng thái mở/đóng của modal) hoặc tham chiếu translateX thay đổi.
   */
  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      // Animated.timing() là hàm tạo hiệu ứng chuyển động (animation) cho một giá trị Animated.Value theo một khoảng thời gian cho trước (timing = "theo thời gian").
      Animated.timing(translateX, {
        toValue: 0, // giá trị cuối cùng của translateX sau khi animation hoàn tất.
        duration: 320, // thời gian diễn ra hiệu ứng (tính bằng mili giây).
        useNativeDriver: true, // native thread của react-native để render animation mượt hơn, hiệu suất cao hơn.
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: screenWidth,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setIsMounted(false);
      });
    }
  }, [visible, translateX]);

  if (!isMounted) return null;

  return (
    <Modal transparent visible={isMounted} animationType="none" onRequestClose={close}>
        {/* Nền mờ và bắt sự kiện bấm ra ngoài để đóng modal */}
      <TouchableOpacity style={menuStyles.backdrop} activeOpacity={1} onPress={close} />
      {/* 
        { transform: [{ translateX }] } là cú pháp dùng trong React Native để áp dụng transform (biến đổi vị trí, tỉ lệ, xoay, v.v.) cho một View.
        - Trong trường hợp này, menu modal trượt ngang từ bên phải vào nhờ animation của translateX (tự động cập nhật bởi Animated.Value).
        - Ta phải viết dạng mảng [{ translateX: ... }] vì prop "transform" của style trong React Native nhận một mảng các object chỉ định loại biến đổi (dịch trái/phải, dọc, xoay, scale...).
        - Ví dụ: { transform: [ { translateX: 100 }, { scale: 0.9 } ] } sẽ vừa dịch, vừa co nhỏ view.
        - Nếu bạn ghi { transform: { translateX } } sẽ bị lỗi, vì transform không nhận plain object trực tiếp mà phải là mảng!
        => Tóm lại: mảng trong transform cho phép bạn combine nhiều loại hiệu ứng (dịch chuyển, xoay, phóng to/nhỏ...) cùng lúc một cách linh hoạt. Và cú pháp này là chuẩn của React Native style system.
      */}
      <Animated.View style={[menuStyles.container, { transform: [{ translateX }] }]}>
        <Text>Menu Modal</Text>
      </Animated.View>
    </Modal>
  );
};

export default MenuModal;