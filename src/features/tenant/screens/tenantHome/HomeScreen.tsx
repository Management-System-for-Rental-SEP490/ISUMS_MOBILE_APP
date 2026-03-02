import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useAuthStore } from "../../../../store/useAuthStore";
import Header from "../../../../shared/components/header";
import { HomeScreenProps, RentalHouse, Device, RootStackParamList } from "../../../../shared/types";
import { useTranslation } from "react-i18next";
import { NavigationProp } from "@react-navigation/native";
import homeStyles from "./homeStyles";
import { gettenantHouseInfo } from "../../../../shared/services/mockHouseService";
import { getHouseDevices } from "../../../../shared/services/deviceData";
import Icons from "../../../../shared/theme/icon"; // Import Icons để hiển thị icon cho thiết bị

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { user, role } = useAuthStore();
  const { t } = useTranslation();
  
  // State để lưu trữ dữ liệu
  const [house, setHouse] = useState<RentalHouse | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // useEffect: Hook chạy khi component được mount (khởi tạo)
  useEffect(() => {
    loadData();
  }, []);

  // Hàm load dữ liệu từ mock service
  const loadData = async () => {
    try {
      setLoading(true);
      // Gọi API giả lập song song để tiết kiệm thời gian
      const [houseData, deviceList] = await Promise.all([
        gettenantHouseInfo(),
        getHouseDevices("H001") // Giả sử ID nhà là H001
      ]);
      
      setHouse(houseData);
      setDevices(deviceList);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  };

  // Hàm render từng item thiết bị trong FlatList
  const renderDeviceItem = ({ item }: { item: Device }) => {
    // Xác định màu sắc và text cho trạng thái thiết bị
    let statusColor = "#10B981"; // Green-500 (Active)
    let statusBg = "#D1FAE5"; // Green-100
    let statusLabel = t('home.device_list.status.active');

    if (item.status === "maintenance") {
      statusColor = "#F59E0B"; // Amber-500
      statusBg = "#FEF3C7"; // Amber-100
      statusLabel = t('home.device_list.status.maintenance');
    } else if (item.status === "inactive") {
      statusColor = "#EF4444"; // Red-500
      statusBg = "#FEE2E2"; // Red-100
      statusLabel = t('home.device_list.status.inactive');
    }

    return (
      <TouchableOpacity 
        style={homeStyles.deviceCard}
        onPress={() => {
            // Chuyển hướng đến màn hình chi tiết thiết bị
            const parentNav = navigation.getParent<NavigationProp<RootStackParamList>>();
            parentNav?.navigate("DeviceDetail", { device: item });
        }}
      >
        <View style={homeStyles.deviceLeft}>
          <View style={homeStyles.deviceInfo}>
            <Text style={homeStyles.deviceName}>{item.name}</Text>
            <Text style={homeStyles.deviceLocation}>{item.location}</Text>
          </View>
        </View>
        
        <View style={[homeStyles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[homeStyles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Component hiển thị phần Header thông tin nhà (được dùng trong ListHeaderComponent của FlatList)
  const renderListHeader = () => (
    <View>
      {/* Card thông tin nhà */}
      <View style={homeStyles.houseInfoCard}>
        <Text style={homeStyles.houseTitle}>{house?.name || t('home.loading_data')}</Text>
        
        <View style={homeStyles.houseDetailRow}>
          <Text style={homeStyles.houseLabel}>{t('home.house_info.address')}</Text>
          <Text style={homeStyles.houseValue} numberOfLines={2}>{house?.address}</Text>
        </View>
        
        <View style={homeStyles.houseDetailRow}>
          <Text style={homeStyles.houseLabel}>{t('home.house_info.contract')}</Text>
          <Text style={homeStyles.houseValue}>{house?.contractId}</Text>
        </View>

        <View style={homeStyles.houseDetailRow}>
            <Text style={homeStyles.houseLabel}>{t('home.house_info.duration')}</Text>
            <Text style={homeStyles.houseValue}>
                {house?.startDate} - {house?.endDate}
            </Text>
        </View>

        <View style={homeStyles.houseDetailRow}>
             <Text style={homeStyles.houseLabel}>{t('home.house_info.status')}</Text>
             <Text style={[homeStyles.houseValue, { color: house?.contractStatus === 'Active' ? 'green' : 'gray' }]}>
                {house?.contractStatus === 'Active' ? t('home.house_info.status_active') : house?.contractStatus}
             </Text>
        </View>
      </View>

      {/* Tiêu đề danh sách thiết bị */}
      <Text style={homeStyles.sectionTitle}>{t('home.device_list.title', { count: devices.length })}</Text>
    </View>
  );

  return (
    <View style={homeStyles.container}>
      <Header variant="default" />
      
      {loading ? (
        <View style={homeStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>{t('home.loading_data')}</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={homeStyles.deviceListContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={loadData}
        />
      )}
    </View>
  );
};

export default HomeScreen;
