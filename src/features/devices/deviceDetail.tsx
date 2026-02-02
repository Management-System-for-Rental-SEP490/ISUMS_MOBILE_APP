import React from "react";
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../shared/types";
import deviceDetailStyles from "./deviceDetailStyles";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
type DeviceDetailRouteProp = RouteProp<RootStackParamList, "DeviceDetail">;
type DeviceDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, "DeviceDetail">;

const DeviceDetail = () => {
  const route = useRoute<DeviceDetailRouteProp>();
  const navigation = useNavigation<DeviceDetailNavigationProp>();
  const { device } = route.params;

  return (
    <SafeAreaProvider style={deviceDetailStyles.background}>
      <ScrollView contentContainerStyle={deviceDetailStyles.content}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={deviceDetailStyles.backButton}
        >
          <Text style={deviceDetailStyles.detailItemValueBold}>← Quay lại</Text>
        </TouchableOpacity>

        <Text style={deviceDetailStyles.title}>
          Chi tiết thiết bị
        </Text>


        <View style={deviceDetailStyles.deviceInfo}>
          <DetailItem label="Tên thiết bị" value={device.name} />
          <DetailItem label="ID" value={device.id} />
          <DetailItem label="Loại" value={device.type === "electric" ? "Điện" : "Nước"} />
          <DetailItem label="Vị trí" value={device.location} />
          <DetailItem label="Trạng thái" value={getStatusText(device.status)} />
          <DetailItem label="NFC Tag ID" value={device.nfcTagId} />
          {/* Nếu thiết bị có trường metadata (thông tin kỹ thuật bổ sung), thì mới hiển thị các thông tin sau: */}
          {device.metadata && ( 
            <>
              <Text style={deviceDetailStyles.technicalInfoTitle}>
                Thông tin kỹ thuật
              </Text>
              <DetailItem label="Số sê-ri" value={device.metadata.serialNumber} />
              <DetailItem label="Nhà sản xuất" value={device.metadata.manufacturer} />
              <DetailItem label="Model" value={device.metadata.model} />
              <DetailItem label="Ngày lắp đặt" value={device.metadata.installationDate} />
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaProvider>
  );
};

const DetailItem = ({ label, value }: { label: string; value?: string }) => (
  <View style={deviceDetailStyles.detailItem}>
    <Text style={deviceDetailStyles.detailItemLabel}>{label}</Text>
    <Text style={deviceDetailStyles.detailItemValue}>
      {value || <Text style={deviceDetailStyles.detailItemValueEmpty}>Không có dữ liệu</Text>}
    </Text>
  </View>
);

const getStatusText = (status: string) => {
  switch (status) {
    case "active": return "Đang hoạt động";
    case "inactive": return "Ngừng hoạt động";
    case "maintenance": return "Đang bảo trì";
    case "pending": return "Chờ xử lý";
    default: return status;
  }
};

export default DeviceDetail;
