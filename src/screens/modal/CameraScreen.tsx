import { useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity, View } from "react-native";
import { useEffect, useState } from "react";
import { Camera, CameraView } from "expo-camera";


const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null); // hasPermission là một biến state để lưu trữ trạng thái quyền truy cập camera.
  const navigation = useNavigation();

  useEffect(() => { // useEffect là một hook trong React để thực hiện side effects (tác dụng phụ) sau khi component render.
    (async () => { // async function là một function được định nghĩa bằng từ khóa async, nó cho phép sử dụng await để đợi promise trả về kết quả.
      const { status } = await Camera.requestCameraPermissionsAsync(); // requestCameraPermissionsAsync là một phương thức của thư viện expo-camera, nó dùng để yêu cầu quyền truy cập camera từ người dùng.
      setHasPermission(status === 'granted'); // setHasPermission là một hàm để cập nhật giá trị của biến hasPermission.
    })();
  }, []); // [] là một array rỗng, nó cho phép chỉ chạy useEffect một lần duy nhất sau khi component render.
  if (hasPermission === null) return <Text>Đang xin quyền...</Text>; // hasPermission === null là một điều kiện để kiểm tra xem có quyền truy cập camera hay không.
  if(hasPermission === false) return <Text>Không có quyền truy cập camera</Text>; // hasPermission === false là một điều kiện để kiểm tra xem có quyền truy cập camera hay không.




  return(
    <View style={{ flex: 1 }}>
        <CameraView style={{ flex: 1 }} facing="back" /> // facing="back" là một tham số để chỉ định camera sẽ sử dụng camera sau (back camera).
        <TouchableOpacity
          onPress={() => navigation.goBack()} // goBack là một phương thức của navigation, nó dùng để quay lại trang trước đó.
          style={{ position: "absolute", bottom: 24, alignSelf: "center" }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Đóng</Text> // text style là một tham số để chỉ định style cho text.
        </TouchableOpacity> // touchable opacity là một component trong React Native, nó dùng để tạo ra một button mà khi người dùng nhấn vào nó, nó sẽ trigger một sự kiện (event) nào đó.
      
    </View>
  );
};

export default CameraScreen;