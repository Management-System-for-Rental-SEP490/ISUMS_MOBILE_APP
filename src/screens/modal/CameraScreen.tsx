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
  }, [permission]);

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