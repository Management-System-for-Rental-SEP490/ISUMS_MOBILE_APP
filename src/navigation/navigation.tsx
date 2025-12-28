import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer, NavigationState } from "@react-navigation/native";
import Login from "../screens/login";
import Home from "../screens/home";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import User from "../screens/user";
import Electric from "../screens/electric";
import Water from "../screens/water";
import { RootStackParamList } from "../types";
import Footer from "../components/footer";

const Stack = createNativeStackNavigator<RootStackParamList>();




const Navigation = () => {
  //tạo state lưu giá trị màn hình hiện tại
  const [currentRoute, setCurrentRoute] = useState("Login");

  // Đúng rồi, bạn hiểu hoàn toàn chính xác:
  // - Tham số 'state' trong handleStateChange được React Navigation truyền vào mỗi khi có sự thay đổi màn hình (navigation state changes).
  // - Navigation state này chứa các thuộc tính như bên dưới (tham khảo trong file types của React Navigation):
  //     {
  //       key: string,
  //       index: number,
  //       routeNames: string[],
  //       history?: unknown[],
  //       routes: NavigationRoute[], // -> mảng gồm tất cả các màn hình (route) hiện có trong navigator
  //       type: string,
  //       stale: false,
  //     }
  // - Cụ thể:
  //     + state.routes: là mảng chứa các màn hình (route object) mà navigator đang quản lý.
  //     + state.index: là chỉ số (index) của màn hình hiện tại (đang active/focused).
  //     + state.routes[state.index]: là object đại diện cho màn hình hiện tại.
  //     + ?.name: nếu màn hình hiện tại có tồn tại thì lấy ra thuộc tính 'name' của màn hình đó (ví dụ "Home", "Login", ...)
  //     + ?. (optional chaining) giúp an toàn khi truy cập, nếu state/routes hoặc state.routes[state.index] không tồn tại thì sẽ không bị lỗi mà trả về undefined.
  // - Tóm lại: state.routes[state.index]?.name chính là cách chuẩn để lấy ra tên của màn hình hiện tại từ navigation state của React Navigation.



  const handleStateChange = (state?: NavigationState) => {
    //        state.routes: chứa mảng các màn hình đang trong navigation stack.
    //      + state.index: chỉ số màn hình hiện tại (focused/active screen).
    //      + state.routes[state.index]: lấy ra route của màn hình hiện tại.
    //      + ...?.name: lấy thuộc tính 'name' để biết đang ở màn hình nào.
    const nextRoute = state?.routes[state.index]?.name ?? "Login";
    setCurrentRoute(nextRoute);
  };

  return (               // là prop của NavigationContainer giúp thực thi tác vụ như chuyển màn hình              
    <NavigationContainer onStateChange={handleStateChange}>
      <View style={styles.layout}>
        <View style={styles.screenWrapper}>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="User" component={User} />
            <Stack.Screen name="Electric" component={Electric} />
            <Stack.Screen name="Water" component={Water} />
          </Stack.Navigator>
        </View>
        
        {currentRoute !== "Login" && <Footer />}
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    backgroundColor: "white",
  },
  screenWrapper: {
    flex: 1,
  },
});

export default Navigation;