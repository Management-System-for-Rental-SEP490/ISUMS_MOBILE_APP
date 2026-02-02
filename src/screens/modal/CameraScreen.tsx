import { useNavigation } from "@react-navigation/native";
import { Text, TouchableOpacity, View, Alert, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { CameraView, useCameraPermissions } from "expo-camera";
import { cameraStyles } from "../../shared/styles/cameraStyles";
import { getDeviceById } from "../../shared/services/deviceData";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../shared/types";

const CameraScreen = () => {
  const [permission, requestPermission] = useCameraPermissions(); 
  const [scanned, setScanned] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>(); 

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]); //[permission] là một array dependencies, nó là một array các giá trị mà hàm useEffect sẽ theo dõi. Khi giá trị này thay đổi, hàm useEffect sẽ được gọi lại.
  // permission.granted là một thuộc tính boolean trả về true nếu người dùng đã cấp quyền truy cập camera cho ứng dụng, false nếu chưa cấp quyền.
  // Nếu permission.granted == true: bạn được phép sử dụng camera.
  // Nếu permission.granted == false: chưa được cấp quyền, cần xin quyền từ người dùng.


  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    const device = getDeviceById(data);

    if (device) {
      navigation.replace("DeviceDetail", { device });
    } else {
      Alert.alert(
        "Không tìm thấy",
        `Không tìm thấy thiết bị với mã: ${data}`,
        [
          {
            text: "Quét lại",
            onPress: () => setScanned(false),
          },
          {
            text: "Đóng",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  if (!permission) { 
    return (
      <View style={cameraStyles.container}>
        <Text style={cameraStyles.text}>Đang tải...</Text>
      </View>
    );
  }

  if (!permission.granted) { 
    return (
      <View style={cameraStyles.container}>
        <Text style={cameraStyles.text}>Không có quyền truy cập camera</Text>
        <TouchableOpacity onPress={requestPermission} style={cameraStyles.button}>
          <Text style={cameraStyles.buttonText}>Cấp quyền</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
     // onBarcodeScanned: Nếu biến scanned là true, giá trị truyền vào sẽ là undefined (nghĩa là tạm tắt chức năng quét). Nếu scanned là false, truyền vào hàm handleBarCodeScanned để xử lý khi camera quét được mã QR.
     // barcodeScannerSettings: chỉ định loại mã vạch cần nhận diện, ở đây là mã "qr" (QR code).
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />
      <View style={cameraStyles.overlay}>
        <View style={cameraStyles.unfocusedContainer}></View>
        <View style={cameraStyles.middleContainer}>
          <View style={cameraStyles.unfocusedContainer}></View>
          <View style={cameraStyles.focusedContainer}></View>
          <View style={cameraStyles.unfocusedContainer}></View>
        </View>
        <View style={cameraStyles.unfocusedContainer}></View>
      </View>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={cameraStyles.closeButton}
      >
        <Text style={cameraStyles.closeButtonText}>Đóng</Text>
      </TouchableOpacity>
    </View>
  );
};



export default CameraScreen;