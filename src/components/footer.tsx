import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Icons from "../theme/icon";
import { FooterRoute, IconProps, RootStackParamList } from "../types";
import footerStyles from "../styles/footerStyles";
// component Footer nhận vào prop tên là currentRoute, kiểu dữ liệu là string hoặc undefined (string | undefined).
const Footer = ({ currentRoute }: { currentRoute?: string }) => {
//khai báo kiểu <NativeStackNavigationProp<RootStackParamList>> cho hook useNavigation để TypeScript hiểu navigation này đang dùng với cấu trúc các màn hình (route) của bạn.
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // kiểu (props: IconProps) => React.ReactElement định nghĩa một hàm nhận vào props kiểu IconProps 
  // (ví dụ: {size, color...}) và sẽ trả về một đối tượng React.ReactElement.
  // React.ReactElement là đại diện cho một thành phần giao diện React (ví dụ: <View />, <Text />, hoặc <Icons.home ... />).
  // Vì vậy, hàm icon trong object item sẽ nhận props và trả về một icon (dưới dạng React element) – tức là kết quả trả về đó 
  // hoàn toàn có thể hiển thị ra màn hình.
  const items: Array<{ name: FooterRoute; icon: (props: IconProps) => React.ReactElement }> = [
    {
      name: "Home",
      // Đúng rồi, `{...props}` sẽ "trải" (spread) toàn bộ thuộc tính của object `props` ra thành các thuộc tính truyền vào `<Icons.home />`.
      // Tuy nhiên, React chỉ truyền những thuộc tính nào mà component (ở đây là hàm `Icons.home`) quan tâm/nhận vào, 
      // các thuộc tính dư không được định nghĩa trong hàm sẽ bị bỏ qua hoặc không ảnh hưởng gì cả.
      // Ví dụ: nếu bạn truyền `<Icons.home size={32} color="black" strangeProp="abc" />`
      // thì trong `Icons.home` chỉ nhận các thuộc tính mà nó định nghĩa (thường là size và color), 
      // còn `strangeProp` không tác động gì (và cũng không làm lỗi).
      // Cách này rất thuận tiện: bạn chỉ cần truyền props chung, component nào dùng thuộc tính nào thì "nhận" thuộc tính đó,
      // còn lại bị bỏ qua tự động, không lo dư hoặc thiếu.
      icon: (props) => <Icons.home {...props} />,
    },
    {
      name: "User",
      icon: (props) => <Icons.user {...props} />,
    },
    {
      name: "Electric",
      icon: (props) => <Icons.electric {...props} />,
    },
    {
      name: "Water",
      icon: (props) => <Icons.water {...props} />,
    },
    {
      name: "Menu",
      icon: (props) => <Icons.menu {...props} />,
    },
  ];


  const handleNavigate = (route: FooterRoute) => {
    switch (route) {
      case "Home":
        navigation.navigate("Home", {});
        break;
      case "User":
        navigation.navigate("User");
        break;
      case "Electric":
        navigation.navigate("Electric");
        break;
      case "Water":
        navigation.navigate("Water");
        break;
      case "Menu":
        //navigation.navigate("Menu");
        break;
    }
  };

  return (
    <View style={footerStyles.footer}>
      
      {items.map((item) => {
        const isActive = item.name === currentRoute;
        return (
          <TouchableOpacity
            key={item.name}
            onPress={() => handleNavigate(item.name)}
            style={[
              footerStyles.iconWrapper,
              // Dòng dưới có ý nghĩa:
              // Nếu `isActive` là true (tức icon này đang được chọn/active), 
              // thì thêm style `footerStyles.iconWrapperActive` vào mảng style. 
              // Nếu không, đoạn này trả về false và sẽ bị bỏ qua (không áp dụng style active).
              // Kết quả: Icon đang chọn sẽ được tô màu nền, đổ bóng và phóng to hơn một chút.
              isActive && footerStyles.iconWrapperActive,
            ]}
          >
            <View style={footerStyles.iconContainer}>
              {item.icon({
                size: isActive ? 32 : 26,
                color: isActive ? "black" : "#1f2937",
              })}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default Footer;