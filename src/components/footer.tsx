import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icons from "../theme/icon";
import { IconProps, MainTabParamList } from "../types";
import { RouteProp } from "@react-navigation/native";
import Home from "../screens/home";
import Electric from "../screens/electric";
import Water from "../screens/water";
import Billing from "../screens/billing";
import Tenants from "../screens/tenants";
import User from "../screens/user";
// Tóm tắt ý nghĩa và chức năng:
// createBottomTabNavigator cho phép bạn tạo ra một thanh điều hướng (bottom tab navigation) ở phía dưới màn hình ứng dụng.
// Thư viện này hỗ trợ các chức năng như:
//  - Đổi trang (chuyển đổi giữa các màn hình) dựa trên các nút bấm trên thanh tab.
//  - Sử dụng các icon tuỳ chỉnh/sẵn có của bạn cho từng tab.
//  - Quản lý việc điều hướng/chuyển trang một cách trực quan qua các tab.
//  - Hỗ trợ tuỳ chỉnh màu sắc, tiêu đề, trạng thái active/inactive cho từng tab.
// Tóm lại, nó giúp bạn xây dựng một giao diện có nhiều trang (screen) mà người dùng có thể di chuyển qua lại dễ dàng bằng các nút trên thanh tab ở bên dưới ứng dụng.


export const Tab = createBottomTabNavigator<MainTabParamList>();
// Giải thích: 
// "Record<keyof MainTabParamList, (props: IconProps) => React.ReactElement>" nghĩa là object này có các key chính là tên các screen trong MainTabParamList.
// Với mỗi key đó, value là một function nhận một tham số props có kiểu IconProps, và trả về một React element (chính là icon để hiển thị cho tab đó).

// Ví dụ:
// Dashboard: (props) => <Icons.home {...props} />
// - Ở đây, Dashboard là tên tab/screen.
// - Giá trị của nó là một hàm (function), nhận đối số là props (kiểu IconProps, ví dụ như { color, size }) rồi trả về một component icon kiểu React element.

// Record<K, V> là một loại (type) tiện ích trong TypeScript, đại diện cho một object với các key là kiểu K và value là kiểu V.


export const tabIconMap: Record<keyof MainTabParamList, (props: IconProps) => React.ReactElement> = {
  Dashboard: (props) => <Icons.home {...props} />, // {...props} là cách truyền các props (props là một object chứa các thuộc tính của component) cho component Icons.home.
  ElectricUsage: (props) => <Icons.electric {...props} />,
  WaterUsage: (props) => <Icons.water {...props} />,
  Billing: (props) => <Icons.contract {...props} />,
  Tenants: (props) => <Icons.people {...props} />,
  Profile: (props) => <Icons.user {...props} />,
};

// ĐÂY LÀ ĐỊNH NGHĨA MỘT HÀM. HÀM NÀY DÙNG LÀM GIÁ TRỊ (VALUE) CHO screenOptions CỦA createBottomTabNavigator.
// LÝ DO HÀM NÀY PHẢI DÙNG ARROW FUNCTION: VÌ MỖI TAB SẼ GỌI HÀM NÀY VỚI route KHÁC NHAU (tức là truyền tham số khác nhau).
// HÀM NÀY KHÔNG PHẢI LÀ 1 COMPONENT, MÀ ĐƠN GIẢN CHỈ LÀ 1 ARROW FUNCTION ĐỂ TẠO TUỲ CHỌN (CONFIGURATION OPTIONS) TUỲ ROUTE.
// Đúng rồi! Hàm `tabScreenOptions` chính là hàm cấu hình (configuration function) mà bạn truyền vào `screenOptions` của `Tab.Navigator`. 
// Cứ mỗi tab (màn hình con) trong hệ thống tab, React Navigation sẽ gọi hàm này với thông tin (route) về tab đó. Bạn dùng thông tin này để chỉ định:
//   - Tab đó sẽ hiện icon gì (tabBarIcon), màu sắc (tabBarActiveTintColor/tabBarInactiveTintColor)
//   - Có hiện tiêu đề header không (headerShown: true/false)
//   - Các tuỳ chỉnh khác về giao diện/tab
// => Kết quả: Hệ thống sẽ biết DỰA TRÊN route (ví dụ: "Dashboard", "Billing"...) thì cần render ra icon, màu sắc và style thế nào trên thanh tab.
// Vì vậy, mỗi lần bạn đổi tab hoặc thêm/bớt tab mới, chỉ cần update ở map icon (tabIconMap) hay cấu hình hàm này là đủ — toàn bộ thanh tab và nội dung sẽ tự động tuân theo cấu hình đó!
/*
  Tóm lại:
    - tabScreenOptions = function cấu hình option của từng tab
    - route (truyền vào) => biết tab đó là gì
    - Trả về: Các thuộc tính liên quan tới giao diện/thông tin từng tab
    - Hệ thống navigation sử dụng output này để quyết định phải render cái gì trên thanh tab!
*/

// Giải thích TỪNG DÒNG, TỪNG CÂU LỆNH và TỪNG KÝ HIỆU
export const tabScreenOptions = (
  {
    // destructuring, lấy thuộc tính "route" từ object truyền vào hàm này
    route, // "route" là thông tin về màn hình/tab hiện tại (do hệ thống truyền vào)
  } : {
    // Khai báo kiểu của tham số object này (TypeScript)
    // Cú pháp "route: RouteProp<MainTabParamList, keyof MainTabParamList>;" nghĩa là:
    // - route: là tên thuộc tính (property) trong object truyền vào.
    // - RouteProp<MainTabParamList, keyof MainTabParamList> là kiểu (type) của thuộc tính route.
    // - RouteProp là một generic type từ thư viện @react-navigation/native, dùng để định nghĩa kiểu cho đối tượng "route" trong screen/tab.
    // - Tham số đầu tiên "MainTabParamList" là type mô tả tất cả các route (screen/tab) và các tham số của chúng.
    // - Tham số thứ hai "keyof MainTabParamList" nghĩa là lấy tên (key) của tất cả các screen có trong MainTabParamList (ví dụ: "Dashboard", "ElectricUsage", ...)
    // => Kết quả: route là một biến mà TypeScript hiểu rằng nó sẽ chứa thông tin về một trong các màn hình có trong MainTabParamList.
    route: RouteProp<MainTabParamList, keyof MainTabParamList>;
    // Nghĩa là: route là 1 object chỉ lấy các tên (key) định nghĩa trong MainTabParamList mà thôi
  }
) => (
  {
    // Ở đây dùng ngoặc tròn để hàm trả về trực tiếp 1 object mà không cần viết "return"
    // (Arrow function có thể trả về trực tiếp object như này, nếu bọc bằng dấu ngoặc tròn)
    
    // Không hiển thị header (tiêu đề trên cùng) cho từng tab
    headerShown: false,

    // Khi tab được chọn, icon/text của tab sẽ có màu này
    tabBarActiveTintColor: "#111827",

    // Khi tab không được chọn, icon/text của tab sẽ có màu này
    tabBarInactiveTintColor: "#9ca3af",

    // tabBarIcon là một function nhỏ dùng để custom icon cho từng tab ở dưới thanh tab bar
    // Hàm này do hệ thống gọi, và truyền vào object có 2 thuộc tính là color, size
    tabBarIcon: (
      { color, size } : { color: string; size: number }
      // Tham số color là màu mà hệ thống muốn bạn dùng cho icon (phụ thuộc vào active/inactive)
      // Tham số size là kích cỡ icon (px)
    ) => {
      // lấy function tạo icon từ tabIconMap, dựa trên route.name (tên tab hiện tại)
      const icon = tabIconMap[route.name];
      // nếu tìm được icon thì truyền 2 props color, size để tạo ra icon đúng màu & cỡ
      // nếu không tìm được thì trả về null (không hiển thị icon)
      return icon ? icon({ color, size }) : null;
    }
  }
);
// Tóm lại: tabScreenOptions là 1 ARROW FUNCTION, mục đích trả về một object option cho từng tab dựa vào tên route

export const TenantTabs = () => (
  // Tab.Navigator là một component được cung cấp bởi thư viện React Navigation (thường là @react-navigation/bottom-tabs hoặc @react-navigation/material-top-tabs).
  // Nó dùng để tạo ra thanh điều hướng tab (tab bar) ở phía dưới hoặc trên màn hình ứng dụng, giúp người dùng chuyển đổi giữa các màn hình (screen) chính.
  // Trong Tab.Navigator, bạn sẽ định nghĩa các Tab.Screen tương ứng với từng màn hình mà bạn muốn hiển thị trong tab bar.
  // Mỗi Tab.Screen sẽ đại diện cho một tab, với thuộc tính name (tên route) và component (component sẽ render khi tab này được chọn).
  // Props "screenOptions" dùng để cấu hình chung cho tất cả các tab (ví dụ: màu sắc, icon, ẩn hiện header,...).
  // Khi ứng dụng chạy, Tab.Navigator sẽ tự động tạo giao diện tab bar và xử lý chuyển đổi giữa các màn hình tương ứng khi người dùng chọn tab.
  <Tab.Navigator screenOptions={tabScreenOptions}>
    <Tab.Screen name="Dashboard" component={Home} options={{ title: "Dashboard" }} />
    <Tab.Screen name="ElectricUsage" component={Electric} options={{ title: "Tiêu thụ điện" }} />
    <Tab.Screen name="WaterUsage" component={Water} options={{ title: "Tiêu thụ nước" }} />
    <Tab.Screen name="Profile" component={User} options={{ title: "Hồ sơ" }} />
  </Tab.Navigator>
);

export const LandlordTabs = () => (
  <Tab.Navigator screenOptions={tabScreenOptions}>
    <Tab.Screen name="Dashboard" component={Home} options={{ title: "Dashboard" }} />
    <Tab.Screen name="Billing" component={Billing} options={{ title: "Billing" }} />
    <Tab.Screen name="Profile" component={User} options={{ title: "Hồ sơ" }} />
  </Tab.Navigator>
);
export const ManagerTabs = () => (
  <Tab.Navigator screenOptions={tabScreenOptions}>
    <Tab.Screen name="Dashboard" component={Home} options={{ title: "Dashboard" }} />
    <Tab.Screen name="Billing" component={Billing} options={{ title: "Billing" }} />
    <Tab.Screen name="Tenants" component={Tenants} options={{ title: "Cư dân" }} />
    <Tab.Screen name="Profile" component={User} options={{ title: "Hồ sơ" }} />
  </Tab.Navigator>
);

