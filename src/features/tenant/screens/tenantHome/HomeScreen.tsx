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
import { HomeScreenProps, RootStackParamList } from "../../../../shared/types";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationProp } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import homeStyles from "./homeStyles";
import {
  TENANT_INVOICES_QUERY_KEY,
  useTenantHouses,
  useUserProfile,
  useUpdateMainHouseMutation,
  useAssetItems,
  useAssetCategories,
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
import {
  formatDayMonthNumeric,
  formatHouseStatusForDisplay,
  getTenantAccessBlock,
  mergeFunctionalAreasForHouse,
  parentScrollOffsetForDropdownField,
  translateTenantAccessReason,
} from "../../../../shared/utils";
import { CustomAlert } from "../../../../shared/components/alert";

/** Trạng thái nhà “đang gắn với tenant” (nhấn màu brand trên Home). */
const isTenantHouseStatusHighlighted = (status?: string) => {
  const u = status?.trim().toUpperCase();
  return u === "AVAILABLE" || u === "RENTED";
};

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const queryClient = useQueryClient();
  const { houseId, setHouseId } = useAuthStore();
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const mainScrollRef = useRef<ScrollView>(null);
  const deviceCategoryFilterYRef = useRef(0);
  const prevSelectedAreaRef = useRef<string | null>(null);
  /** Khi chọn khu vực: cuộn nhẹ xuống block dropdown để user thấy ngay danh mục/thiết bị. */
  const scrollDropdownPreviewIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = parentScrollOffsetForDropdownField(
          deviceCategoryFilterYRef.current,
          180
        );
        mainScrollRef.current?.scrollTo({ y: target, animated: true });
      });
    });
  }, []);
  /** DropdownBox — cuộn để ô tìm nằm dưới header app. */
  const scrollDeviceCategoryFilterIntoView = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = parentScrollOffsetForDropdownField(deviceCategoryFilterYRef.current);
        mainScrollRef.current?.scrollTo({ y: target, animated: true });
      });
    });
  }, []);
  const [houseModalVisible, setHouseModalVisible] = useState(false);
  const autoSetMainHouseRef = useRef<string>("");
  const [isSubmittingMainHouse, setIsSubmittingMainHouse] = useState(false);
  const [pendingMainHouseId, setPendingMainHouseId] = useState<string | null>(null);
  const updateMainHouseMutation = useUpdateMainHouseMutation();
  const mutateMainHouse = updateMainHouseMutation.mutate;
  const mutateMainHouseAsync = updateMainHouseMutation.mutateAsync;

  const {
    data: housesData,
    isLoading: loadingHouses,
    refetch: refetchHouses,
  } = useTenantHouses();
  const tenantHouses: HouseFromApi[] = housesData?.data ?? [];
  const { data: userProfile, isPending: profilePending } = useUserProfile();
  const profileMainHouseId = String(userProfile?.mainHouseId ?? "").trim();
  const hasPersistedMainHouse = useMemo(
    () =>
      profileMainHouseId.length > 0 &&
      tenantHouses.some((h) => h.id === profileMainHouseId),
    [profileMainHouseId, tenantHouses]
  );

  useEffect(() => {
    if (loadingHouses || tenantHouses.length === 0) return;
    if (houseId && !tenantHouses.some((h) => h.id === houseId)) {
      setHouseId(null);
    }
  }, [loadingHouses, tenantHouses, houseId, setHouseId]);

  useEffect(() => {
    if (loadingHouses) return;
    if (tenantHouses.length !== 1) return;
    const only = tenantHouses[0]!;
    if (houseId !== only.id) setHouseId(only.id);
    if (autoSetMainHouseRef.current === only.id) return;
    autoSetMainHouseRef.current = only.id;
    mutateMainHouse({ houseId: only.id });
  }, [loadingHouses, tenantHouses, houseId, setHouseId, mutateMainHouse]);

  useEffect(() => {
    if (loadingHouses || tenantHouses.length <= 1) return;
    const hasValidSelectedHouse =
      Boolean(houseId) && tenantHouses.some((h) => h.id === houseId);
    const mainFromProfile = String(userProfile?.mainHouseId ?? "").trim();
    if (mainFromProfile && tenantHouses.some((h) => h.id === mainFromProfile)) {
      if (!hasValidSelectedHouse) setHouseId(mainFromProfile);
      setHouseModalVisible(false);
      return;
    }
    if (hasValidSelectedHouse) {
      setHouseModalVisible(false);
      return;
    }
    setHouseModalVisible(true);
  }, [
    loadingHouses,
    tenantHouses,
    houseId,
    setHouseId,
    profilePending,
    userProfile?.mainHouseId,
  ]);

  const { house: myHouse, houseId: tenantHouseId, thingId } = useTenantContext();
  const hasTenantHouse = Boolean(myHouse);

  const accessBlock = useMemo(() => {
    if (loadingHouses || !myHouse) return null;
    return getTenantAccessBlock(myHouse);
  }, [loadingHouses, myHouse]);

  const accessReasonText = useMemo(
    () => translateTenantAccessReason(myHouse?.accessReason, myHouse?.accessStatus, t),
    [myHouse?.accessReason, myHouse?.accessStatus, t]
  );

  const openPaymentScreen = useCallback(() => {
    const parentNav = navigation.getParent<NavigationProp<RootStackParamList>>();
    const selectedPendingInvoiceId = String(myHouse?.pendingInvoiceId ?? "").trim();
    parentNav?.navigate("TenantRentPayment", {
      invoiceId: selectedPendingInvoiceId || undefined,
      invoiceIds: selectedPendingInvoiceId ? [selectedPendingInvoiceId] : undefined,
      afterSuccess: "home",
    });
  }, [navigation, myHouse?.pendingInvoiceId]);

  const {
    data: itemsData,
    isLoading: loadingItems,
    refetch: refetchItems,
  } = useAssetItems({
    houseId: myHouse?.id,
  });

  const devices: AssetItemFromApi[] = useMemo(
    () =>
      (itemsData?.data ?? []).filter((item) =>
        myHouse ? item.houseId === myHouse.id : false
      ),
    [itemsData?.data, myHouse]
  );

  const { data: categoriesData, refetch: refetchCategories } = useAssetCategories();
  const categories: AssetCategoryFromApi[] = categoriesData?.data ?? [];

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

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [deviceFloor, setDeviceFloor] = useState("1");
  const [selectedFunctionAreaId, setSelectedFunctionAreaId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const [dropdownExpandSignal, setDropdownExpandSignal] = useState(0);

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

  /** Thiết bị trong phạm vi khu vực (null = tất cả nhà). */
  const rawItemsByArea = useMemo(() => {
    if (selectedFunctionAreaId == null) return devices;
    return devices.filter((d) => d.functionAreaId === selectedFunctionAreaId);
  }, [devices, selectedFunctionAreaId]);

  useEffect(() => {
    if (
      selectedFunctionAreaId != null &&
      selectedFunctionAreaId !== prevSelectedAreaRef.current
    ) {
      setDropdownExpandSignal((n) => n + 1);
      scrollDropdownPreviewIntoView();
    }
    prevSelectedAreaRef.current = selectedFunctionAreaId;
  }, [selectedFunctionAreaId, scrollDropdownPreviewIntoView]);

  useEffect(() => {
    setSelectedCategoryId(null);
  }, [myHouse?.id, selectedFunctionAreaId, deviceFloor]);

  const groupItemsByCategory = useCallback(
    (items: AssetItemFromApi[]) => {
      const map = new Map<string, AssetItemFromApi[]>();
      for (const item of items) {
        const list = map.get(item.categoryId) ?? [];
        list.push(item);
        map.set(item.categoryId, list);
      }
      const result: {
        categoryId: string;
        categoryName: string;
        items: AssetItemFromApi[];
      }[] = [];
      for (const cat of categories) {
        const groupItems = map.get(cat.id);
        if (groupItems?.length) {
          const sorted = [...groupItems].sort((a, b) =>
            (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
              sensitivity: "base",
            })
          );
          result.push({ categoryId: cat.id, categoryName: cat.name, items: sorted });
          map.delete(cat.id);
        }
      }
      for (const [categoryId, groupItems] of map) {
        const sorted = [...groupItems].sort((a, b) =>
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
    [categories, t]
  );

  const devicesByCategoryAll = useMemo(
    () => groupItemsByCategory(devices),
    [groupItemsByCategory, devices]
  );

  const devicesByCategory = useMemo(
    () => groupItemsByCategory(rawItemsByArea),
    [groupItemsByCategory, rawItemsByArea]
  );

  const filteredDevicesByCategory = useMemo(() => {
    if (selectedCategoryId === null) return devicesByCategory;
    return devicesByCategory.filter((g) => g.categoryId === selectedCategoryId);
  }, [devicesByCategory, selectedCategoryId]);

  const filteredDeviceRows = useMemo(() => {
    const rows: { categoryName: string; item: AssetItemFromApi }[] = [];
    for (const g of filteredDevicesByCategory) {
      for (const item of g.items) {
        rows.push({ categoryName: g.categoryName, item });
      }
    }
    return rows;
  }, [filteredDevicesByCategory]);

  const categoryFilterSection = useMemo((): DropdownBoxSection | null => {
    if (devices.length === 0 || devicesByCategoryAll.length === 0) return null;
    return {
      id: "category",
      title: t("dropdown_box.section_category"),
      itemLayout: "chips",
      items: devicesByCategoryAll.map(({ categoryId, categoryName }) => ({
        id: categoryId,
        label: categoryName,
      })),
      selectedId: selectedCategoryId,
      showAllOption: true,
    };
  }, [devices.length, devicesByCategoryAll, selectedCategoryId, t]);

  const deviceFilterSection = useMemo((): DropdownBoxSection | null => {
    if (filteredDeviceRows.length === 0) return null;
    return {
      id: "device",
      title: t("staff_building_detail.devices_title", { count: filteredDeviceRows.length }),
      itemLayout: "list",
      selectedId: null,
      showAllOption: false,
      items: filteredDeviceRows.map(({ categoryName, item }) => ({
        id: item.id,
        label: item.displayName ?? item.id,
        detail: categoryName,
      })),
    };
  }, [filteredDeviceRows, t]);

  const categoryFilterSummary = t("dropdown_box.compact_search_label");

  const handleCategoryDropdownSelect = useCallback(
    (_sectionId: string, itemId: string | null) => {
      if (deviceSearchQuery.trim().length > 0) return;
      setSelectedCategoryId(itemId);
    },
    [deviceSearchQuery]
  );

  const handleDeviceDropdownSelect = useCallback(
    (_sectionId: string, itemId: string | null) => {
      if (!itemId) return;
      const found = filteredDeviceRows.find((row) => row.item.id === itemId)?.item;
      if (!found) return;
      const parentNav = navigation.getParent<NavigationProp<RootStackParamList>>();
      parentNav?.navigate("TenantItemDetail", { item: found });
    },
    [filteredDeviceRows, navigation]
  );

  const handleHouseDropdownSelect = useCallback(
    (sectionId: string, itemId: string | null) => {
      if (sectionId === "device") {
        handleDeviceDropdownSelect(sectionId, itemId);
        return;
      }
      handleCategoryDropdownSelect(sectionId, itemId);
    },
    [handleCategoryDropdownSelect, handleDeviceDropdownSelect]
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchHouses(), refetchItems(), refetchCategories()]);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchHouses, refetchItems, refetchCategories]);

  const handleSelectMainHouse = useCallback(
    async (selectedHouseId: string) => {
      if (!selectedHouseId || isSubmittingMainHouse) return;
      if (hasPersistedMainHouse) {
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        await queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY });
        refetchItems();
        refetchCategories();
        return;
      }
      try {
        setIsSubmittingMainHouse(true);
        setPendingMainHouseId(selectedHouseId);
        await mutateMainHouseAsync({ houseId: selectedHouseId });
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        await queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY });
        await refetchHouses();
        refetchItems();
        refetchCategories();
      } catch {
        CustomAlert.alert(
          t("home.main_house_update_failed_title"),
          t("home.main_house_update_failed_message"),
          [{ text: t("common.close"), style: "default" }],
          { type: "error" }
        );
      } finally {
        setIsSubmittingMainHouse(false);
        setPendingMainHouseId(null);
      }
    },
    [
      isSubmittingMainHouse,
      hasPersistedMainHouse,
      queryClient,
      refetchCategories,
      refetchHouses,
      refetchItems,
      setHouseId,
      tenantHouses,
      t,
      mutateMainHouseAsync,
    ]
  );

  const renderHomeScrollContent = () => {
    if (!hasTenantHouse && !loadingHouses) {
      return null;
    }

    return (
      <View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
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
                contractDocuments: myHouse.contractDocuments,
                hasUnpaidInvoice: myHouse.hasUnpaidInvoice,
                pendingInvoiceId: myHouse.pendingInvoiceId ?? null,
                accessStatus: myHouse.accessStatus,
                accessReason: myHouse.accessReason ?? null,
                memberRole: myHouse.memberRole,
              });
            }
          }}
        >
          <View style={homeStyles.houseInfoCard}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
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

        {!accessBlock ? (
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
                    borderColor: iotConnected
                      ? "rgba(59, 181, 130, 0.45)"
                      : brandBlueMutedBorder,
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
                  {iotConnected
                    ? t("consumption.iot_live")
                    : t("consumption.iot_offline")}
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
                  <ActivityIndicator
                    size="small"
                    color={brandPrimary}
                    style={{ marginVertical: 8 }}
                  />
                ) : (
                  <>
                    <Text style={homeStyles.usageSummaryCardRow}>
                      {t("consumption.period_day")}:{" "}
                      {electricUsage.dayVal.toFixed(2)} {electricUsage.unit}
                    </Text>
                    <Text style={homeStyles.usageSummaryCardRow}>
                      {t("consumption.period_week")}:{" "}
                      {electricUsage.weekVal.toFixed(2)} {electricUsage.unit}
                    </Text>
                    <Text
                      style={[
                        homeStyles.usageSummaryCardRow,
                        homeStyles.usageSummaryCardMonth,
                      ]}
                    >
                      {t("consumption.period_month")}:{" "}
                      {electricUsage.monthVal.toFixed(2)} {electricUsage.unit}
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
                  <ActivityIndicator
                    size="small"
                    color={brandPrimary}
                    style={{ marginVertical: 8 }}
                  />
                ) : (
                  <>
                    <Text style={homeStyles.usageSummaryCardRow}>
                      {t("consumption.period_day")}: {waterUsage.dayVal.toFixed(2)}{" "}
                      {waterUsage.unit}
                    </Text>
                    <Text style={homeStyles.usageSummaryCardRow}>
                      {t("consumption.period_week")}: {waterUsage.weekVal.toFixed(2)}{" "}
                      {waterUsage.unit}
                    </Text>
                    <Text
                      style={[
                        homeStyles.usageSummaryCardRow,
                        homeStyles.usageSummaryCardMonth,
                      ]}
                    >
                      {t("consumption.period_month")}: {waterUsage.monthVal.toFixed(2)}{" "}
                      {waterUsage.unit}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

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

        {categoryFilterSection ? (
          <View
            onLayout={(e) => {
              deviceCategoryFilterYRef.current = e.nativeEvent.layout.y;
            }}
          >
            <DropdownBox
              sections={
                deviceFilterSection
                  ? [categoryFilterSection, deviceFilterSection]
                  : [categoryFilterSection]
              }
              summary={categoryFilterSummary}
              onSelect={handleHouseDropdownSelect}
              style={{ marginHorizontal: 16, marginBottom: 8, marginTop: 4 }}
              keyboardVerticalOffset={insets.top + 52}
              onSearchInputFocus={scrollDeviceCategoryFilterIntoView}
              onSearchChange={setDeviceSearchQuery}
              searchAutoFocus={false}
              expandSignal={dropdownExpandSignal}
            />
          </View>
        ) : null}

        {!loading && hasTenantHouse && devices.length === 0 ? (
          <View style={[homeStyles.devicesEmpty, { marginHorizontal: 16 }]}>
            <Text style={homeStyles.devicesEmptyText}>
              {t("staff_building_detail.no_devices")}
            </Text>
          </View>
        ) : null}

        {!loading &&
        hasTenantHouse &&
        devices.length > 0 &&
        filteredDeviceRows.length === 0 ? (
          <View style={[homeStyles.devicesEmpty, { marginHorizontal: 16 }]}>
            <Text style={homeStyles.devicesEmptyText}>
              {t("staff_home.all_devices_no_items")}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (!loadingHouses && tenantHouses.length === 0) {
    return (
      <View style={homeStyles.container}>
        <Header variant="default" />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={homeStyles.accessGateEmptyWrap}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing || loading}
              onRefresh={onRefresh}
              colors={[brandPrimary]}
              tintColor={brandPrimary}
            />
          }
        >
          <Text style={homeStyles.accessGateEmptyText}>{t("home.access.no_house")}</Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={homeStyles.container}>
      <Header variant="default" />

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
          <ScrollView
            ref={mainScrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={homeStyles.deviceListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing || loading}
                onRefresh={onRefresh}
                colors={[brandPrimary]}
                tintColor={brandPrimary}
              />
            }
          >
            {renderHomeScrollContent()}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <Modal
        visible={houseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          const picked = houseId && tenantHouses.some((h) => h.id === houseId);
          if (tenantHouses.length > 1 && !picked) return;
          setHouseModalVisible(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            const picked = houseId && tenantHouses.some((h) => h.id === houseId);
            if (tenantHouses.length > 1 && !picked) return;
            setHouseModalVisible(false);
          }}
        >
          <View style={homeStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={homeStyles.modalContent}>
                <Text style={homeStyles.modalTitle}>
                  {t("home.select_main_house") || "Chọn nhà chính"}
                </Text>
                <FlatList
                  data={tenantHouses}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        homeStyles.houseItem,
                        item.id === myHouse?.id && homeStyles.houseItemActive,
                      ]}
                      onPress={() => handleSelectMainHouse(item.id)}
                      disabled={isSubmittingMainHouse}
                    >
                      <Text
                        style={[
                          homeStyles.houseItemText,
                          item.id === myHouse?.id && homeStyles.houseItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSubmittingMainHouse && item.id === pendingMainHouseId ? (
                        <ActivityIndicator size="small" color={brandPrimary} />
                      ) : item.id === myHouse?.id ? (
                        <Text style={{ color: brandPrimary, fontWeight: "bold" }}>✓</Text>
                      ) : null}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={homeStyles.separator} />}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {accessBlock ? (
        <View
          style={[homeStyles.accessGateOverlay, { paddingTop: insets.top + 74 }]}
          pointerEvents="auto"
        >
          <View style={homeStyles.accessGateBannerCard}>
            <Text style={homeStyles.accessGateCardTitle}>
              {accessBlock === "handover"
                ? t("home.access.handover_title")
                : accessBlock === "deposit"
                  ? t("home.access.deposit_title")
                  : t("home.access.payment_title")}
            </Text>
            <Text style={homeStyles.accessGateCardBody}>
              {accessBlock === "handover"
                ? accessReasonText ||
                  t("home.access.handover_body", {
                    date: myHouse?.handoverDate
                      ? formatDayMonthNumeric(new Date(myHouse.handoverDate), i18n.language)
                      : "—",
                  })
                : accessBlock === "deposit"
                  ? accessReasonText || t("home.access.deposit_body")
                  : accessReasonText || t("home.access.payment_body")}
            </Text>
            {accessBlock === "payment" ? (
              <TouchableOpacity
                style={homeStyles.accessGatePrimaryBtn}
                onPress={openPaymentScreen}
                activeOpacity={0.85}
              >
                <Text style={homeStyles.accessGatePrimaryBtnText}>
                  {t("home.access.pay_now")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      ) : null}
    </View>
  );
};

export default HomeScreen;
