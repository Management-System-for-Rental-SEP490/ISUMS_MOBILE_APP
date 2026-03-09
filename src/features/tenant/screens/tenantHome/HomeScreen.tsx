import React, { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuthStore } from "../../../../store/useAuthStore";
import Header from "../../../../shared/components/header";
import { HomeScreenProps, RootStackParamList } from "../../../../shared/types";
import { useTranslation } from "react-i18next";
import { NavigationProp } from "@react-navigation/native";
import homeStyles from "./homeStyles";
import { useHouses, useAssetItems, useAssetCategories } from "../../../../shared/hooks";
import type { AssetItemFromApi, HouseFromApi, AssetCategoryFromApi } from "../../../../shared/types/api";

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { houseId } = useAuthStore();
  const { t } = useTranslation();
  
  // 1. Lấy danh sách nhà (để tìm thông tin nhà của tenant)
  const { data: housesData, isLoading: loadingHouses, refetch: refetchHouses } = useHouses();
  const houses: HouseFromApi[] = housesData?.data ?? [];

  // Tìm nhà của tenant trong danh sách
  const myHouse = useMemo(() => {
    if (!houseId) return null;
    return houses.find(h => h.id === houseId) || null;
  }, [houses, houseId]);

  // 2. Lấy danh sách thiết bị của nhà đó
  const { 
    data: itemsData, 
    isLoading: loadingItems, 
    refetch: refetchItems 
  } = useAssetItems({ houseId: houseId || "" }); // Nếu không có houseId thì không fetch gì (hoặc fetch rỗng)
  
  const devices: AssetItemFromApi[] = itemsData?.data ?? [];

  // 3. Lấy danh mục để hiển thị tên loại thiết bị
  const { data: categoriesData } = useAssetCategories();
  const categories: AssetCategoryFromApi[] = categoriesData?.data ?? [];

  const loading = loadingHouses || loadingItems;

  const onRefresh = () => {
    refetchHouses();
    refetchItems();
  };

  // Hàm render từng item thiết bị trong FlatList
  const renderDeviceItem = ({ item }: { item: AssetItemFromApi }) => {
    // Xác định màu sắc và text cho trạng thái thiết bị
    let statusColor = "#10B981"; // Green-500 (Active)
    let statusBg = "#D1FAE5"; // Green-100
    let statusLabel = t('home.device_list.status.active');

    if (item.status === "MAINTENANCE") {
      statusColor = "#F59E0B"; // Amber-500
      statusBg = "#FEF3C7"; // Amber-100
      statusLabel = t('home.device_list.status.maintenance');
    } else if (item.status === "INACTIVE" || item.status === "DISPOSED") {
      statusColor = "#EF4444"; // Red-500
      statusBg = "#FEE2E2"; // Red-100
      statusLabel = t('home.device_list.status.inactive');
    } else if (item.status === "AVAILABLE") {
        statusColor = "#3B82F6"; // Blue-500
        statusBg = "#DBEAFE"; // Blue-100
        statusLabel = t('staff_item_list.status_available');
    } else if (item.status === "IN_USE") {
        statusColor = "#10B981"; // Green-500
        statusBg = "#D1FAE5"; // Green-100
        statusLabel = t('staff_item_list.status_in_use');
    }

    const categoryName = categories.find(c => c.id === item.categoryId)?.name || t('staff_item_list.category_other');

    return (
      <TouchableOpacity 
        style={homeStyles.deviceCard}
        onPress={() => {
            // Chuyển hướng đến màn hình chi tiết thiết bị (Tenant dùng chung DeviceDetail hoặc tạo mới TenantDeviceDetail)
            // Hiện tại dùng DeviceDetail, cần map dữ liệu sang kiểu Device nếu cần, hoặc update DeviceDetail để nhận AssetItemFromApi
            // Để đơn giản, ta sẽ cast tạm hoặc sửa DeviceDetail sau.
            // Ở đây ta giả định DeviceDetail nhận prop `device` kiểu cũ, ta cần map.
            const parentNav = navigation.getParent<NavigationProp<RootStackParamList>>();
            
            // Map AssetItemFromApi -> Device (tạm thời)
            const mappedDevice: any = {
                id: item.id,
                name: item.displayName,
                type: "other", // Cần logic map type từ category
                nfcTagId: item.nfcTag || "",
                location: myHouse?.name || "", // Hoặc tìm room name
                status: item.status.toLowerCase(),
                metadata: {
                    serialNumber: item.serialNumber,
                    manufacturer: "",
                    model: "",
                    installationDate: ""
                }
            };
            parentNav?.navigate("DeviceDetail", { device: mappedDevice });
        }}
      >
        <View style={homeStyles.deviceLeft}>
          <View style={homeStyles.deviceInfo}>
            <Text style={homeStyles.deviceName}>{item.displayName}</Text>
            <Text style={homeStyles.deviceLocation}>{categoryName}</Text>
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

  // Component hiển thị phần Header thông tin nhà
  const renderListHeader = () => {
    if (!houseId) {
        return (
            <View style={homeStyles.houseInfoCard}>
                <Text style={homeStyles.houseTitle}>{t('common.no_data')}</Text>
                <Text style={homeStyles.houseValue}>Bạn chưa được gán vào căn nhà nào.</Text>
            </View>
        );
    }

    if (!myHouse && !loadingHouses) {
         return (
            <View style={homeStyles.houseInfoCard}>
                <Text style={homeStyles.houseTitle}>{t('common.not_found_title')}</Text>
                <Text style={homeStyles.houseValue}>Không tìm thấy thông tin nhà.</Text>
            </View>
        );
    }

    return (
    <View>
      {/* Card thông tin nhà */}
      <View style={homeStyles.houseInfoCard}>
        <Text style={homeStyles.houseTitle}>{myHouse?.name || t('home.loading_data')}</Text>
        
        <View style={homeStyles.houseDetailRow}>
          <Text style={homeStyles.houseLabel}>{t('home.house_info.address')}</Text>
          <Text style={homeStyles.houseValue} numberOfLines={2}>{myHouse?.address}</Text>
        </View>
        
        {/* Các thông tin khác nếu có trong API HouseFromApi */}
        {myHouse?.description && (
            <View style={homeStyles.houseDetailRow}>
            <Text style={homeStyles.houseLabel}>Mô tả</Text>
            <Text style={homeStyles.houseValue}>{myHouse.description}</Text>
            </View>
        )}

        <View style={homeStyles.houseDetailRow}>
             <Text style={homeStyles.houseLabel}>{t('home.house_info.status')}</Text>
             <Text style={[homeStyles.houseValue, { color: myHouse?.status === 'RENTED' ? 'green' : 'gray' }]}>
                {myHouse?.status === 'RENTED' ? t('home.house_info.status_active') : myHouse?.status}
             </Text>
        </View>
      </View>

      {/* Tiêu đề danh sách thiết bị */}
      <Text style={homeStyles.sectionTitle}>{t('home.device_list.title', { count: devices.length })}</Text>
    </View>
  )};

  return (
    <View style={homeStyles.container}>
      <Header variant="default" />
      
      {loading && !housesData ? (
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
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

export default HomeScreen;
