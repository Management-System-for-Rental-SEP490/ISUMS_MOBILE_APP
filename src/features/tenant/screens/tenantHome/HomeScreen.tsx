import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuthStore } from "../../../../store/useAuthStore";
import Header from "../../../../shared/components/header";
import {
  DropdownBox,
  type DropdownBoxSection,
} from "../../../../shared/components/dropdownBox";
import SuggestionDropdown, { Suggestion } from "../../../../shared/components/SuggestionDropdown";
import { HomeScreenProps, RootStackParamList } from "../../../../shared/types";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationProp } from "@react-navigation/native";
import homeStyles from "./homeStyles";
import {
  useTenantHouses,
  useAssetItems,
  useAssetCategories,
  useAssetCategoryNamesByIds,
  useTenantContext,
  useFunctionalAreasByHouseId,
} from "../../../../shared/hooks";
import { FloorPlanView } from "../../houseStructure";
import { useTenantIoTConnection, useTenantUsage } from "../../hooks/useTenantIoT";
import { ExpandableLongText } from "../../../../shared/components/ExpandableLongText";
import { DEFAULT_BE_SHORT_TEXT_MAX_CHARS } from "../../../../shared/utils";
import {
  brandBlueMutedBg,
  brandBlueMutedBorder,
  brandPrimary,
  brandSecondary,
  brandTintBg,
  neutral,
} from "../../../../shared/theme/color";
import type {
  AssetItemFromApi,
  HouseFromApi,
  AssetCategoryFromApi,
  FunctionalAreaFromApi,
} from "../../../../shared/types/api";
import { normalizeAssetItemStatusFromApi } from "../../../../shared/types/api";
import {
  formatHouseStatusForDisplay,
  getTotalPages,
  mergeFunctionalAreasForHouse,
  parentScrollOffsetForDropdownField,
  slicePage,
} from "../../../../shared/utils";
import { PaginationBar } from "../../../../shared/components/PaginationBar";

/** Trạng thái nhà “đang gắn với tenant” (nhấn màu brand trên Home). */
const isTenantHouseStatusHighlighted = (status?: string) => {
  const u = status?.trim().toUpperCase();
  return u === "AVAILABLE" || u === "RENTED";
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const { houseId, setHouseId } = useAuthStore();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const deviceListRef = useRef<FlatList<AssetItemFromApi>>(null);
  const deviceCategoryFilterYRef = useRef(0);
  /** DropdownBox trong ListHeader — cuộn vừa đủ để thanh tìm nằm dưới header app, không kéo sát mép trên. */
  const scrollDeviceCategoryFilterIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = parentScrollOffsetForDropdownField(deviceCategoryFilterYRef.current);
        deviceListRef.current?.scrollToOffset({ offset: target, animated: true });
      });
    });
  }, []);
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
  const hasTenantHouse = Boolean(myHouse);

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
        myHouse ? item.houseId === myHouse.id : false
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
  const [deviceListPage, setDeviceListPage] = useState(1);
  /** Tầng đang xem trên sơ đồ / danh sách khu vực (giống màn điện–nước). */
  const [deviceFloor, setDeviceFloor] = useState("1");
  /** null = mọi thiết bị (theo danh mục); chọn id = chỉ thiết bị gắn khu vực đó. */
  const [selectedFunctionAreaId, setSelectedFunctionAreaId] = useState<string | null>(null);

  const houseIdForAreas = String(myHouse?.id ?? "").trim();
  const { data: functionalAreasRes } = useFunctionalAreasByHouseId(houseIdForAreas);

  const effectiveFunctionalAreas = useMemo((): FunctionalAreaFromApi[] => {
    return mergeFunctionalAreasForHouse(
      myHouse ?? undefined,
      functionalAreasRes?.data
    );
  }, [myHouse, functionalAreasRes?.data]);

  const floorOptions = useMemo(() => {
    const fk = (a: FunctionalAreaFromApi) => String(a.floorNo ?? "").trim() || "1";
    const floors = new Set(effectiveFunctionalAreas.map(fk));
    const list = Array.from(floors).sort(
      (a, b) => parseInt(a, 10) - parseInt(b, 10)
    );
    return list;
  }, [effectiveFunctionalAreas]);

  useEffect(() => {
    if (floorOptions.length && !floorOptions.includes(deviceFloor)) {
      setDeviceFloor(floorOptions[0]!);
    }
  }, [floorOptions, deviceFloor]);

  useEffect(() => {
    setSelectedFunctionAreaId(null);
  }, [deviceFloor, myHouse?.id]);

  const filteredDevices = useMemo(() => {
    let list = devices;
    if (selectedCategoryId != null) {
      list = list.filter((d) => d.categoryId === selectedCategoryId);
    }
    if (selectedFunctionAreaId != null) {
      list = list.filter((d) => d.functionAreaId === selectedFunctionAreaId);
    }
    return list;
  }, [devices, selectedCategoryId, selectedFunctionAreaId]);

  // Tên category: nếu categories list chưa có categoryId của từng item thì gọi GET /assets/categories/:id.
  const uniqueCategoryIds = useMemo(
    () => Array.from(new Set(filteredDevices.map((d) => d.categoryId).filter(Boolean))),
    [filteredDevices]
  );

  const { categoryNameById } = useAssetCategoryNamesByIds(uniqueCategoryIds, categories);

  /** Lọc thiết bị (đã lọc category) theo từ khoá tìm kiếm (tên / tên danh mục). */
  const displayDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredDevices;
    return filteredDevices.filter((item) => {
      const catName =
        categories.find((c) => c.id === item.categoryId)?.name ??
        categoryNameById.get(item.categoryId) ??
        "";
      return (
        (item.displayName ?? "").toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q)
      );
    });
  }, [filteredDevices, categories, searchQuery, categoryNameById]);

  const deviceTotalPages = getTotalPages(displayDevices.length);
  const pagedDisplayDevices = useMemo(
    () => slicePage(displayDevices, deviceListPage),
    [displayDevices, deviceListPage]
  );

  /** Đổi nhà / lọc / tìm kiếm / khu trên sơ đồ / tầng → về trang 1 danh sách thiết bị. */
  useEffect(() => {
    setDeviceListPage(1);
  }, [
    myHouse?.id,
    selectedCategoryId,
    searchQuery,
    selectedFunctionAreaId,
    deviceFloor,
  ]);

  useEffect(() => {
    setDeviceListPage((pg) => Math.min(pg, deviceTotalPages));
  }, [deviceTotalPages]);

  const onDeviceListPageChange = useCallback((p: number) => {
    setDeviceListPage(p);
    requestAnimationFrame(() => {
      deviceListRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }, []);

  const deviceCategoryFilterSections = useMemo((): DropdownBoxSection[] => {
    return [
      {
        id: "category",
        title: t("dropdown_box.section_category"),
        items: categories.map((c) => ({ id: c.id, label: c.name })),
        selectedId: selectedCategoryId,
        showAllOption: true,
      },
    ];
  }, [categories, selectedCategoryId, t]);

  const deviceCategoryFilterSummary = useMemo(() => {
    const all = t("staff_home.all_devices_category_all");
    if (selectedCategoryId === null) {
      return `${t("dropdown_box.category_short")}: ${all}`;
    }
    const name = categories.find((c) => c.id === selectedCategoryId)?.name ?? "";
    return `${t("dropdown_box.category_short")}: ${name}`;
  }, [selectedCategoryId, categories, t]);

  const onDeviceCategoryFilterSelect = useCallback(
    (sectionId: string, itemId: string | null) => {
      if (sectionId === "category") setSelectedCategoryId(itemId);
    },
    []
  );

  /** Gợi ý tìm kiếm: tối đa 6 thiết bị khớp với searchQuery. */
  const suggestions = useMemo<Suggestion[]>(() => {
    if (!searchQuery.trim()) return [];
    return displayDevices.slice(0, 6).map((item) => ({
      id: item.id,
      label: item.displayName,
      sublabel:
        categories.find((c) => c.id === item.categoryId)?.name ??
        categoryNameById.get(item.categoryId) ??
        "",
      typeLabel: t("search.type_item"),
    }));
  }, [searchQuery, displayDevices, categories, t, categoryNameById]);

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
    const normalizedStatus = normalizeAssetItemStatusFromApi(item.status);

    // Trạng thái thiết bị — chỉ dùng palette thương hiệu (theme/color).
    let statusColor = brandPrimary;
    let statusBg = brandTintBg;
    let statusLabel = t('home.device_list.status.active');

    if (item.status === "MAINTENANCE") {
      statusColor = brandSecondary;
      statusBg = brandBlueMutedBg;
      statusLabel = t('home.device_list.status.maintenance');
    } else if (
      item.status === "INACTIVE" ||
      normalizedStatus === "DISPOSED" ||
      normalizedStatus === "BROKEN"
    ) {
      statusColor = brandSecondary;
      statusBg = brandBlueMutedBg;
      statusLabel = t('home.device_list.status.inactive');
    } else if (normalizedStatus === "IN_USE" || normalizedStatus === "ACTIVE") {
      statusColor = brandPrimary;
      statusBg = brandTintBg;
      statusLabel = t("home.device_list.status.active");
    }

    const categoryName =
      categories.find((c) => c.id === item.categoryId)?.name ||
      categoryNameById.get(item.categoryId) ||
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
    if (!hasTenantHouse && !loadingHouses) {
      return null;
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
              <ExpandableLongText
                text={myHouse?.address}
                maxLength={DEFAULT_BE_SHORT_TEXT_MAX_CHARS}
                textStyle={homeStyles.houseValue}
                containerStyle={{ flex: 1 }}
              />
            </View>

            {/* Các thông tin khác nếu có trong API HouseFromApi */}
            {myHouse?.description && (
              <View style={homeStyles.houseDetailRow}>
                <Text style={homeStyles.houseLabel}>
                  {t("home.house_info.description")}
                </Text>
                <ExpandableLongText
                  text={myHouse.description}
                  textStyle={homeStyles.houseValue}
                  containerStyle={{ flex: 1 }}
                />
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
                    color: isTenantHouseStatusHighlighted(myHouse?.status)
                      ? brandPrimary
                      : neutral.textSecondary,
                  },
                ]}
              >
                {formatHouseStatusForDisplay(myHouse?.status, t)}
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
                  backgroundColor: iotConnected ? brandTintBg : brandBlueMutedBg,
                  borderColor: iotConnected ? "rgba(59, 181, 130, 0.45)" : brandBlueMutedBorder,
                },
              ]}
            >
              <View
                style={[
                  homeStyles.usageSummaryLiveDot,
                  { backgroundColor: iotConnected ? brandPrimary : brandSecondary },
                ]}
              />
              <Text
                style={[
                  homeStyles.usageSummaryLiveText,
                  { color: iotConnected ? brandPrimary : brandSecondary },
                ]}
              >
                {iotConnected ? t("consumption.iot_live") : t("consumption.iot_offline")}
              </Text>
            </View>
          </View>
          <View style={homeStyles.usageSummaryCards}>
            <TouchableOpacity
              style={[homeStyles.usageSummaryCard, { borderLeftColor: brandPrimary }]}
              onPress={() => navigation.navigate("ElectricUsage")}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.usageSummaryCardTitle}>
                {t("consumption.electric_summary")}
              </Text>
              {electricUsage.loading ? (
                <ActivityIndicator size="small" color={brandPrimary} style={{ marginVertical: 8 }} />
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
              style={[homeStyles.usageSummaryCard, { borderLeftColor: brandPrimary }]}
              onPress={() => navigation.navigate("WaterUsage")}
              activeOpacity={0.8}
            >
              <Text style={homeStyles.usageSummaryCardTitle}>
                {t("consumption.water_summary")}
              </Text>
              {waterUsage.loading ? (
                <ActivityIndicator size="small" color={brandPrimary} style={{ marginVertical: 8 }} />
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

        {/* Thiết bị: chọn tầng (gọn) → sơ đồ → danh mục → danh sách */}
        <Text style={[homeStyles.sectionTitle, { marginBottom: 4 }]}>
          {t("home.device_list.by_area_title")}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={homeStyles.deviceFloorScroll}
          contentContainerStyle={homeStyles.deviceFloorContent}
          keyboardShouldPersistTaps="handled"
        >
          {floorOptions.map((floor) => {
            const active = deviceFloor === floor;
            return (
              <TouchableOpacity
                key={floor}
                style={[
                  homeStyles.deviceFloorChip,
                  active && homeStyles.deviceFloorChipActive,
                ]}
                onPress={() => setDeviceFloor(floor)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    homeStyles.deviceFloorChipText,
                    active && homeStyles.deviceFloorChipTextActive,
                  ]}
                >
                  {t("consumption.floor_label", { floor })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FloorPlanView
          selectedFloor={deviceFloor}
          selectedAreaId={selectedFunctionAreaId ?? "all"}
          functionalAreas={effectiveFunctionalAreas}
          onSelectArea={(id) =>
            setSelectedFunctionAreaId((prev) => (prev === id ? null : id))
          }
          accentColor={brandPrimary}
        />

        <View
          onLayout={(e) => {
            deviceCategoryFilterYRef.current = e.nativeEvent.layout.y;
          }}
        >
          <DropdownBox
            sections={deviceCategoryFilterSections}
            summary={deviceCategoryFilterSummary}
            onSelect={onDeviceCategoryFilterSelect}
            style={{ marginHorizontal: 16, marginBottom: 8 }}
            keyboardVerticalOffset={insets.top + 52}
            onSearchInputFocus={scrollDeviceCategoryFilterIntoView}
          />
        </View>

        <Text style={[homeStyles.sectionTitle, { marginTop: 8 }]}>
          {t("home.device_list.title", { count: displayDevices.length })}
        </Text>
      </View>
    );
  };

  return (
    <View style={homeStyles.container}>
      <Header
        variant="default"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 52}
      >
        {loading && !housesData ? (
          <View style={homeStyles.loadingContainer}>
            <ActivityIndicator size="large" color={brandPrimary} />
            <Text style={{ marginTop: 10, color: neutral.textSecondary }}>
              {t("home.loading_data")}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={deviceListRef}
            data={pagedDisplayDevices}
            renderItem={renderDeviceItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={homeStyles.deviceListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={() => (
              <PaginationBar
                currentPage={deviceListPage}
                totalPages={deviceTotalPages}
                onPageChange={onDeviceListPageChange}
                style={{ paddingBottom: Math.max(8, insets.bottom) }}
              />
            )}
            ListEmptyComponent={
              !loading && hasTenantHouse
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
      </KeyboardAvoidingView>

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
                        <Text style={{ color: brandPrimary, fontWeight: 'bold' }}>✓</Text>
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
