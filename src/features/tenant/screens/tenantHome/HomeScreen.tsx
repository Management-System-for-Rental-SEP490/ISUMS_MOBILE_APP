import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useAuthStore } from "../../../../store/useAuthStore";
import Header from "../../../../shared/components/header";
import { HomeScreenProps, RootStackParamList } from "../../../../shared/types";
import { useTranslation } from "react-i18next";
import { NavigationProp } from "@react-navigation/native";
import homeStyles from "./homeStyles";
import { useTenantHouses, useAssetItems, useAssetCategories, useTenantContext } from "../../../../shared/hooks";
import { useTenantIoTConnection, useTenantUsage } from "../../hooks/useTenantIoT";
import type {
  AssetItemFromApi,
  HouseFromApi,
  AssetCategoryFromApi,
} from "../../../../shared/types/api";

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { houseId } = useAuthStore();
  const { t } = useTranslation();

  // 1. Lấy danh sách nhà GẮN VỚI TENANT hiện tại (API mới /api/houses/house)
  const {
    data: housesData,
    isLoading: loadingHouses,
    refetch: refetchHouses,
  } = useTenantHouses();
  const tenantHouses: HouseFromApi[] = housesData?.data ?? [];

  // Tìm nhà của tenant:
  // - Nếu store có sẵn houseId thì ưu tiên tìm theo id đó.
  // - Nếu không có, lấy căn nhà đầu tiên trong danh sách BE trả về.
  const myHouse = useMemo<HouseFromApi | null>(() => {
    if (!tenantHouses.length) return null;
    if (houseId) {
      return tenantHouses.find((h) => h.id === houseId) || tenantHouses[0];
    }
    return tenantHouses[0];
  }, [tenantHouses, houseId]);

  // 2. Lấy danh sách thiết bị của nhà đó
  const {
    data: itemsData,
    isLoading: loadingItems,
    refetch: refetchItems,
  } = useAssetItems({
    // Nếu chưa xác định được nhà thì không truyền houseId để tránh query sai.
    houseId: myHouse?.id,
  });

  const devices: AssetItemFromApi[] = useMemo(
    () =>
      (itemsData?.data ?? []).filter((item) =>
        myHouse ? item.houseId === myHouse.id : true
      ),
    [itemsData?.data, myHouse]
  );

  // 3. Lấy danh mục để hiển thị tên loại thiết bị (GET /api/assets/categories)
  const { data: categoriesData, refetch: refetchCategories } = useAssetCategories();
  const categories: AssetCategoryFromApi[] = categoriesData?.data ?? [];

  // 4. Ngữ cảnh IoT tenant (houseId, thingId) và dữ liệu usage từ AWS
  const { houseId: tenantHouseId, thingId } = useTenantContext();
  const iotConnected = useTenantIoTConnection(thingId);
  const electricUsage = useTenantUsage({
    houseId: tenantHouseId,
    metric: "electricity",
  });
  const waterUsage = useTenantUsage({
    houseId: tenantHouseId,
    metric: "water",
  });

  const loading = loadingHouses || loadingItems;

  // Category đang chọn: null = tất cả
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const filteredDevices = useMemo(
    () =>
      selectedCategoryId == null
        ? devices
        : devices.filter((d) => d.categoryId === selectedCategoryId),
    [devices, selectedCategoryId]
  );

  const onRefresh = () => {
    refetchHouses();
    refetchItems();
    refetchCategories();
  };

  /**
   * Nhóm thiết bị theo danh mục để hiển thị “xếp theo danh mục”.
   * Mỗi phần tử: { categoryId, categoryName, items }.
   */
  const devicesByCategory = useMemo(
    () => {
      const map = new Map<string, AssetItemFromApi[]>();
      for (const item of filteredDevices) {
        const list = map.get(item.categoryId) ?? [];
        list.push(item);
        map.set(item.categoryId, list);
      }
      const result: {
        categoryId: string;
        categoryName: string;
        items: AssetItemFromApi[];
      }[] = [];

      // Ưu tiên theo thứ tự categories từ API
      for (const cat of categories) {
        const list = map.get(cat.id);
        if (list?.length) {
          const sorted = [...list].sort((a, b) =>
            (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
              sensitivity: "base",
            })
          );
          result.push({
            categoryId: cat.id,
            categoryName: cat.name,
            items: sorted,
          });
          map.delete(cat.id);
        }
      }

      // Phần còn lại gom vào "Khác"
      for (const [categoryId, list] of map) {
        const sorted = [...list].sort((a, b) =>
          (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
            sensitivity: "base",
          })
        );
        result.push({
          categoryId,
          categoryName: t("staff_building_detail.category_other"),
          items: sorted,
        });
      }

      return result;
    },
    [filteredDevices, categories, t]
  );

  // Hàm render từng item thiết bị
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
      statusLabel = t("staff_item_list.status_available");
    } else if (item.status === "IN_USE") {
      statusColor = "#10B981"; // Green-500
      statusBg = "#D1FAE5"; // Green-100
      statusLabel = t("staff_item_list.status_in_use");
    }

    const categoryName =
      categories.find((c) => c.id === item.categoryId)?.name ||
      t("staff_item_list.category_other");

    return (
      <TouchableOpacity
        style={homeStyles.deviceCard}
        onPress={() => {
          // Mở màn chi tiết thiết bị (TenantItemDetail): truyền item từ API, màn hình sẽ fetch lại theo id và hiển thị giống ItemDescription.
          const parentNav =
            navigation.getParent<NavigationProp<RootStackParamList>>();
          parentNav?.navigate("TenantItemDetail", { item });
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
    if (!myHouse && !loadingHouses) {
      return (
        <View style={homeStyles.houseInfoCard}>
          <Text style={homeStyles.houseTitle}>{t("common.not_found_title")}</Text>
          <Text style={homeStyles.houseValue}>
            Không tìm thấy thông tin nhà.
          </Text>
        </View>
      );
    }

    return (
      <View>
        {/* Card thông tin nhà – cho phép nhấn để xem chi tiết nhà (sau này có thể điều hướng sang màn TenantHouse riêng). */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            // Điều hướng lên stack root. Hiện tại tái sử dụng route BuildingDetail,
            // khi có màn TenantHouse riêng có thể đổi navigate sang route mới.
            const parentNav =
              navigation.getParent<NavigationProp<RootStackParamList>>();
            if (myHouse && parentNav) {
              parentNav.navigate("BuildingDetail", {
                buildingId: myHouse.id,
                buildingName: myHouse.name,
                buildingAddress: myHouse.address,
                description: myHouse.description,
                ward: myHouse.ward,
                commune: myHouse.commune,
                city: myHouse.city,
                status: myHouse.status,
                functionalAreas: myHouse.functionalAreas ?? [],
              });
            }
          }}
        >
          <View style={homeStyles.houseInfoCard}>
            <Text style={homeStyles.houseTitle}>
              {myHouse?.name || t("home.loading_data")}
            </Text>

            <View style={homeStyles.houseDetailRow}>
              <Text style={homeStyles.houseLabel}>
                {t("home.house_info.address")}
              </Text>
              <Text style={homeStyles.houseValue} numberOfLines={2}>
                {myHouse?.address}
              </Text>
            </View>

            {/* Các thông tin khác nếu có trong API HouseFromApi */}
            {myHouse?.description && (
              <View style={homeStyles.houseDetailRow}>
                <Text style={homeStyles.houseLabel}>
                  {t("home.house_info.description")}
                </Text>
                <Text style={homeStyles.houseValue}>
                  {myHouse.description}
                </Text>
              </View>
            )}

            <View style={homeStyles.houseDetailRow}>
              <Text style={homeStyles.houseLabel}>
                {t("home.house_info.status")}
              </Text>
              <Text
                style={[
                  homeStyles.houseValue,
                  {
                    color:
                      myHouse?.status === "RENTED" ? "#16a34a" : "#6b7280",
                  },
                ]}
              >
                {myHouse?.status === "RENTED"
                  ? t("home.house_info.status_active")
                  : myHouse?.status}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Tổng quan tiêu thụ điện/nước từ IoT AWS – tổng theo tháng, nhấn xem chi tiết */}
        <View style={homeStyles.usageSummarySection}>
          <View style={homeStyles.usageSummaryHeader}>
            <Text style={homeStyles.usageSummaryTitle}>
              {t("consumption.summary_title")}
            </Text>
            <View
              style={[
                homeStyles.usageSummaryLiveChip,
                {
                  backgroundColor: iotConnected ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                  borderColor: iotConnected ? "rgba(74,222,128,0.5)" : "rgba(248,113,113,0.5)",
                },
              ]}
            >
              <View
                style={[
                  homeStyles.usageSummaryLiveDot,
                  { backgroundColor: iotConnected ? "#4ADE80" : "#F87171" },
                ]}
              />
              <Text
                style={[
                  homeStyles.usageSummaryLiveText,
                  { color: iotConnected ? "#16a34a" : "#dc2626" },
                ]}
              >
                {iotConnected ? t("consumption.iot_live") : t("consumption.iot_offline")}
              </Text>
            </View>
          </View>
          <View style={homeStyles.usageSummaryCards}>
            <TouchableOpacity
              style={[homeStyles.usageSummaryCard, { borderLeftColor: "#2563EB" }]}
              onPress={() => navigation.navigate("ElectricUsage")}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.usageSummaryCardTitle}>
                {t("consumption.electric_summary")}
              </Text>
              {electricUsage.loading ? (
                <ActivityIndicator size="small" color="#2563EB" style={{ marginVertical: 8 }} />
              ) : (
                <>
                  <Text style={homeStyles.usageSummaryCardRow}>
                    {t("consumption.period_day")}: {electricUsage.dayVal.toFixed(2)} {electricUsage.unit}
                  </Text>
                  <Text style={homeStyles.usageSummaryCardRow}>
                    {t("consumption.period_week")}: {electricUsage.weekVal.toFixed(2)} {electricUsage.unit}
                  </Text>
                  <Text style={[homeStyles.usageSummaryCardRow, homeStyles.usageSummaryCardMonth]}>
                    {t("consumption.period_month")}: {electricUsage.monthVal.toFixed(2)} {electricUsage.unit}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[homeStyles.usageSummaryCard, { borderLeftColor: "#0D9488" }]}
              onPress={() => navigation.navigate("WaterUsage")}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.usageSummaryCardTitle}>
                {t("consumption.water_summary")}
              </Text>
              {waterUsage.loading ? (
                <ActivityIndicator size="small" color="#0D9488" style={{ marginVertical: 8 }} />
              ) : (
                <>
                  <Text style={homeStyles.usageSummaryCardRow}>
                    {t("consumption.period_day")}: {waterUsage.dayVal.toFixed(2)} {waterUsage.unit}
                  </Text>
                  <Text style={homeStyles.usageSummaryCardRow}>
                    {t("consumption.period_week")}: {waterUsage.weekVal.toFixed(2)} {waterUsage.unit}
                  </Text>
                  <Text style={[homeStyles.usageSummaryCardRow, homeStyles.usageSummaryCardMonth]}>
                    {t("consumption.period_month")}: {waterUsage.monthVal.toFixed(2)} {waterUsage.unit}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tiêu đề danh sách thiết bị – hiển thị số thiết bị sau khi lọc theo danh mục */}
        <Text style={homeStyles.sectionTitle}>
          {t("home.device_list.title", { count: filteredDevices.length })}
        </Text>

        {/* Thanh category ngang: Tất cả + các danh mục có thiết bị trong nhà (từ API categories) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={homeStyles.categoryScroll}
          contentContainerStyle={homeStyles.categoryContent}
        >
          <TouchableOpacity
            style={[
              homeStyles.categoryChip,
              selectedCategoryId === null && homeStyles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategoryId(null)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                homeStyles.categoryChipText,
                selectedCategoryId === null &&
                  homeStyles.categoryChipTextActive,
              ]}
            >
              {t("staff_home.all_devices_category_all")}
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isActive = selectedCategoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  homeStyles.categoryChip,
                  isActive && homeStyles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategoryId(cat.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    homeStyles.categoryChipText,
                    isActive && homeStyles.categoryChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={homeStyles.container}>
      <Header variant="default" />

      {loading && !housesData ? (
        <View style={homeStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>
            {t("home.loading_data")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDevices}
          renderItem={renderDeviceItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderListHeader}
          contentContainerStyle={homeStyles.deviceListContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading
              ? () => (
                  <View style={homeStyles.devicesEmpty}>
                    <Text style={homeStyles.devicesEmptyText}>
                      {t("staff_home.all_devices_no_items")}
                    </Text>
                  </View>
                )
              : null
          }
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

export default HomeScreen;
