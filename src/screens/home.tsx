// Welcome to screens

import { Text, View } from "react-native";
import { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../types";
import { homeStyles } from "../styles/homeScreen/homeStyles";
// Đúng rồi! Khi một component React nhận props từ React Navigation, props đó là một object chứa nhiều thuộc tính (ví dụ: `navigation`, `route`, ...).
// Chúng ta dùng destructuring trong tham số function: `({ route }: { route: HomeRouteProp })`,
// nghĩa là lấy thẳng object `route` ra từ prop thay vì phải viết `props.route`.
//
// Tiếp theo, chúng ta quy định (kiểu hóa) rằng tham số `route` phải thỏa mãn đúng kiểu `HomeRouteProp` – 
// tức là kiểu dữ liệu do `RouteProp<RootStackParamList, "Home">` trả về.
// Điều này đảm bảo khi truy cập route.params hoặc các thuộc tính khác, TypeScript sẽ kiểm tra type giúp mình.
//
// Tóm lại:
// - Prop truyền vào component Home là một object có nhiều thuộc tính, trong đó có `route`.
// - Dùng destructuring để lấy thẳng `route`, giúp code ngắn gọn.
// - Dùng `{ route }: { route: HomeRouteProp }` để đảm bảo biến `route` có đúng type, an toàn khi truy cập `route.params.username`.
// - Dữ liệu (ví dụ: username) sẽ được truyền từ màn hình trước (như trang login) qua thuộc tính `params` của `route`.
//
//  => Nhờ vậy bạn có thể viết `const username = route.params?.username ?? "Bạn";` một cách an toàn và ngắn gọn!







type HomeRouteProp = RouteProp<RootStackParamList, "Home">;

const Home = ({ route }: { route: HomeRouteProp }) => {
  const username = route.params?.username || "Anh iu em lắm lắm";
  
  return (
    <View style={homeStyles.container}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>Hello, {username}</Text>
      
    </View>
  );
};

export default Home;

