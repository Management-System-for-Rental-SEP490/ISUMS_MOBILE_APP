import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { useAuthStore } from "../../../../store/useAuthStore";
import Header from "../../../../shared/components/header";
import SuggestionDropdown, { Suggestion } from "../../../../shared/components/SuggestionDropdown";
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
  const { houseId, setHouseId } = useAuthStore();
  const { t } = useTranslation();
  const [houseModalVisible, setHouseModalVisible] = useState(false);

  // 1. Lấy danh sách nhà GẮN VỚI TENANT hiện tại (API mới /api/houses/house)
  const {
    data: housesData,
    isLoading: loadingHouses,
    refetch: refetchHouses,
  } = useTenantHouses();
  const tenantHouses: HouseFromApi[] = housesData?.data ?? [];

  // Sử dụng context để lấy nhà hiện tại (đồng bộ với houseId trong store)
  const { house: myHouse, houseId: tenantHouseId, thingId } = useTenantContext();

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
  // const { houseId: tenantHouseId, thingId } = useTenantContext(); // Đã lấy ở trên
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
  /** Chuỗi tìm kiếm từ ô search trên Header. */
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDevices = useMemo(
    () =>
      selectedCategoryId == null
        ? devices
        : devices.filter((d) => d.categoryId === selectedCategoryId),
    [devices, selectedCategoryId]
  );

  /** Lọc thiết bị (đã lọc category) theo từ khoá tìm kiếm (tên / tên danh mục). */
  const displayDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredDevices;
    return filteredDevices.filter((item) => {
      const catName = categories.find((c) => c.id === item.categoryId)?.name ?? "";
      return (
        (item.displayName ?? "").toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q)
      );
    });
  }, [filteredDevices, categories, searchQuery]);

  /** Gợi ý tìm kiếm: tối đa 6 thiết bị khớp với searchQuery. */
  const suggestions = useMemo<Suggestion[]>(() => {
    if (!searchQuery.trim()) return [];
    return displayDevices.slice(0, 6).map((item) => ({
      id: item.id,
      label: item.displayName,
      sublabel: categories.find((c) => c.id === item.categoryId)?.name ?? "",
      typeLabel: t("search.type_item"),
    }));
  }, [searchQuery, displayDevices, categories, t]);

  /** Xử lý khi chọn gợi ý: điều hướng tới màn chi tiết thiết bị. */
  const handleSuggestionSelect = (sug: Suggestion) => {
    setSearchQuery("");
    const item = devices.find((i) => i.id === sug.id);
    if (item) {
      const parentNav = navigation.getParent<NavigationProp<RootStackParamList>>();
      parentNav?.navigate("TenantItemDetail", { item });
    }
  };

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
    // AssetStatus: API có thể trả về "AVAILABLE" nhưng app coi như "IN_USE"
    const normalizedStatus = item.status === "AVAILABLE" ? "IN_USE" : item.status;

    // Xác định màu sắc và text cho trạng thái thiết bị
    let statusColor = "#10B981"; // Green-500 (Active)
    let statusBg = "#D1FAE5"; // Green-100
    let statusLabel = t('home.device_list.status.active');

    if (item.status === "MAINTENANCE") {
      statusColor = "#F59E0B"; // Amber-500
      statusBg = "#FEF3C7"; // Amber-100
      statusLabel = t('home.device_list.status.maintenance');
    } else if (
      item.status === "INACTIVE" ||
      item.status === "DISPOSED" ||
      item.status === "BROKEN" ||
      item.status === "DELETED"
    ) {
      statusColor = "#EF4444"; // Red-500
      statusBg = "#FEE2E2"; // Red-100
      statusLabel = t('home.device_list.status.inactive');
    } else if (normalizedStatus === "IN_USE" || normalizedStatus === "ACTIVE") {
      statusColor = "#10B981"; // Green-500
      statusBg = "#D1FAE5"; // Green-100
      statusLabel = t("home.device_list.status.active");
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[homeStyles.houseTitle, { flex: 1 }]}>
                  {myHouse?.name || t("home.loading_data")}
                </Text>
                {tenantHouses.length > 1 && (
                  <TouchableOpacity
                    style={homeStyles.switchHouseButton}
                    onPress={() => setHouseModalVisible(true)}
                  >
                    <Text style={homeStyles.switchHouseText}>
                      {t("home.switch_house") || "Đổi nhà"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

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

        {/* Tiêu đề danh sách thiết bị – hiển thị số thiết bị sau khi lọc theo danh mục + search */}
        <Text style={homeStyles.sectionTitle}>
          {t("home.device_list.title", { count: displayDevices.length })}
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
      <Header
        variant="default"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={t("search.placeholder_tenant")}
      />

      <View style={{ flex: 1 }}>
        {loading && !housesData ? (
          <View style={homeStyles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={{ marginTop: 10, color: "#6B7280" }}>
              {t("home.loading_data")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayDevices}
            renderItem={renderDeviceItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={homeStyles.deviceListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
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
        <SuggestionDropdown
          visible={searchQuery.trim().length > 0}
          suggestions={suggestions}
          query={searchQuery}
          onSelect={handleSuggestionSelect}
        />
      </View>

      {/* Modal chọn nhà */}
      <Modal
        visible={houseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setHouseModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setHouseModalVisible(false)}>
          <View style={homeStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={homeStyles.modalContent}>
                <Text style={homeStyles.modalTitle}>{t("home.select_house") || "Chọn nhà"}</Text>
                <FlatList
                  data={tenantHouses}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        homeStyles.houseItem,
                        item.id === myHouse?.id && homeStyles.houseItemActive
                      ]}
                      onPress={() => {
                        setHouseId(item.id);
                        setHouseModalVisible(false);
                        // Refresh data khi đổi nhà
                        setTimeout(() => onRefresh(), 100);
                      }}
                    >
                      <Text style={[
                        homeStyles.houseItemText,
                        item.id === myHouse?.id && homeStyles.houseItemTextActive
                      ]}>
                        {item.name}
                      </Text>
                      {item.id === myHouse?.id && (
                        <Text style={{ color: '#3B82F6', fontWeight: 'bold' }}>✓</Text>
                      )}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={homeStyles.separator} />}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

export default HomeScreen;
