/**
 * Chi tiết nhà (tenant): thông tin, đổi nhà đang xem, đặt nhà chính (PUT), hợp đồng.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import * as WebBrowser from "expo-web-browser";
import Icons from "../../../../shared/theme/icon";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import { RootStackParamList } from "../../../../shared/types";
import type { HouseFromApi } from "../../../../shared/types/api";
import tenantHouseStyles from "./tenantHouseStyles";
import homeStyles from "../tenantHome/homeStyles";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";
import { brandPrimary, brandSecondary, neutral } from "../../../../shared/theme/color";
import { ExpandableLongText } from "../../../../shared/components/ExpandableLongText";
import { DEFAULT_BE_SHORT_TEXT_MAX_CHARS, formatHouseStatusForDisplay } from "../../../../shared/utils";
import {
  TENANT_INVOICES_QUERY_KEY,
  useTenantHouses,
  useTenantInvoices,
  useUpdateMainHouseMutation,
  useUserProfile,
  useAssetItems,
  asAssetItemArray,
  useAssetCategories,
  useFunctionalAreasByHouseId,
} from "../../../../shared/hooks";
import { useAuthStore } from "../../../../store/useAuthStore";
import {
  DropdownBox,
  type DropdownBoxSection,
} from "../../../../shared/components/dropdownBox";
import { FloorPlanView } from "../../houseStructure";
import type {
  AssetCategoryFromApi,
  AssetItemFromApi,
  FunctionalAreaFromApi,
} from "../../../../shared/types/api";
import {
  DROPDOWN_SEARCH_TOP_INSET_PX,
  isFieldObscuredByKeyboard,
  mergeFunctionalAreasForHouse,
  parentScrollOffsetForDropdownField,
} from "../../../../shared/utils";
import { tenantHouseHasUnpaidRentExcludingIssue } from "../../../../shared/utils/tenantInvoice";

type TenantHouseRouteProp = RouteProp<RootStackParamList, "BuildingDetail">;
type TenantHouseNavProp = NativeStackNavigationProp<RootStackParamList, "BuildingDetail">;

function houseFromApiToBuildingDetail(h: HouseFromApi): RootStackParamList["BuildingDetail"] {
  return {
    buildingId: h.id,
    buildingName: h.name,
    buildingAddress: h.address,
    description: h.description,
    ward: h.ward,
    commune: h.commune,
    city: h.city,
    status: h.status,
    functionalAreas: h.functionalAreas ?? [],
    contractDocuments: h.contractDocuments,
    hasUnpaidInvoice: h.hasUnpaidInvoice,
    pendingInvoiceId: h.pendingInvoiceId ?? null,
    accessStatus: h.accessStatus,
    accessReason: h.accessReason ?? null,
    memberRole: h.memberRole,
  };
}

const isTenantHouseStatusHighlighted = (status?: string) => {
  const u = status?.trim().toUpperCase();
  return u === "AVAILABLE" || u === "RENTED";
};

const TenantHouseDescription = () => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TenantHouseNavProp>();
  const route = useRoute<TenantHouseRouteProp>();
  const queryClient = useQueryClient();
  const { houseId, setHouseId } = useAuthStore();

  const {
    buildingId,
    buildingName,
    buildingAddress,
    description,
    ward,
    commune,
    city,
    status,
    functionalAreas: routeFunctionalAreas,
    contractDocuments,
    pendingInvoiceId,
    accessStatus: routeAccessStatus,
  } = route.params;

  const { data: housesData, refetch: refetchHouses } = useTenantHouses();
  const tenantHouses: HouseFromApi[] = housesData?.data ?? [];
  const { data: invoiceListRaw, isLoading: invoicesLoading, isFetched } = useTenantInvoices(true);
  const invoiceListForBanner = invoiceListRaw ?? [];
  const buildingIdStr = String(buildingId ?? "").trim();
  const showPaymentBanner = useMemo(() => {
    if (!buildingIdStr) return false;
    const st = String(routeAccessStatus ?? "").trim().toUpperCase();
    if (st === "PENDING_FIRST_RENT") return true;
    if (isFetched && !invoicesLoading) {
      return tenantHouseHasUnpaidRentExcludingIssue(invoiceListForBanner, buildingIdStr);
    }
    return false;
  }, [
    buildingIdStr,
    routeAccessStatus,
    isFetched,
    invoicesLoading,
    invoiceListForBanner,
  ]);
  const { data: userProfile, isPending: profilePending } = useUserProfile();
  const profileMainHouseId = String(userProfile?.mainHouseId ?? "").trim();
  const hasPersistedMainHouse = useMemo(
    () =>
      profileMainHouseId.length > 0 &&
      tenantHouses.some((h) => h.id === profileMainHouseId),
    [profileMainHouseId, tenantHouses]
  );

  const updateMainHouseMutation = useUpdateMainHouseMutation();
  const mutateMainHouseAsync = updateMainHouseMutation.mutateAsync;

  const [houseModalVisible, setHouseModalVisible] = useState(false);
  const [isSubmittingMainHouse, setIsSubmittingMainHouse] = useState(false);
  const [pendingMainHouseId, setPendingMainHouseId] = useState<string | null>(null);

  const planScrollRef = useRef<ScrollView>(null);
  const deviceCategoryFilterYRef = useRef(0);
  const deviceCategoryFilterMeasureRef = useRef<View>(null);
  const prevSelectedAreaRef = useRef<string | null>(null);
  const keyboardHeightRef = useRef(0);
  const [keyboardExtraBottom, setKeyboardExtraBottom] = useState(0);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [deviceFloor, setDeviceFloor] = useState("1");
  const [selectedFunctionAreaId, setSelectedFunctionAreaId] = useState<string | null>(null);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState("");
  const [dropdownExpandSignal, setDropdownExpandSignal] = useState(0);

  useEffect(() => {
    const onShow = (e: { endCoordinates?: { height?: number } }) => {
      const keyboardHeight = e.endCoordinates?.height ?? 0;
      keyboardHeightRef.current = keyboardHeight;
      setKeyboardExtraBottom(Math.max(0, keyboardHeight - insets.bottom));
    };
    const onHide = () => {
      keyboardHeightRef.current = 0;
      setKeyboardExtraBottom(0);
    };
    const showSub = Keyboard.addListener("keyboardDidShow", onShow);
    const hideSub = Keyboard.addListener("keyboardDidHide", onHide);
    const subs = [showSub, hideSub];
    if (Platform.OS === "ios") {
      subs.push(Keyboard.addListener("keyboardWillHide", onHide));
    }
    return () => subs.forEach((s) => s.remove());
  }, [insets.bottom]);

  const scrollDeviceCategoryFilterIntoView = useCallback(() => {
    const attemptScroll = (attempt: number) => {
      const kh = keyboardHeightRef.current;
      if (Platform.OS === "ios" && kh <= 0) {
        if (attempt < 14) {
          setTimeout(() => attemptScroll(attempt + 1), 60);
        }
        return;
      }

      deviceCategoryFilterMeasureRef.current?.measureInWindow((x, y, w, h) => {
        const fieldBottom = y + h;
        if (!isFieldObscuredByKeyboard(fieldBottom, kh)) {
          return;
        }

        const topInset =
          kh > 0
            ? Math.max(
                36,
                DROPDOWN_SEARCH_TOP_INSET_PX - Math.min(Math.round(kh * 0.45), 120)
              )
            : DROPDOWN_SEARCH_TOP_INSET_PX;
        const scrollY = parentScrollOffsetForDropdownField(
          deviceCategoryFilterYRef.current,
          topInset
        );
        planScrollRef.current?.scrollTo({ y: scrollY, animated: true });
      });
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => attemptScroll(0));
    });
    setTimeout(() => attemptScroll(0), Platform.OS === "ios" ? 120 : 240);
  }, []);

  const scrollDeviceDropdownOpenIntoView = useCallback(() => {
    const topInsetPx = 64;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = parentScrollOffsetForDropdownField(
          deviceCategoryFilterYRef.current,
          topInsetPx
        );
        planScrollRef.current?.scrollTo({ y: target, animated: true });
      });
    });
  }, []);

  const onDeviceDropdownExpandedChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setKeyboardExtraBottom(0);
        return;
      }
      scrollDeviceDropdownOpenIntoView();
    },
    [scrollDeviceDropdownOpenIntoView]
  );

  const houseForMerge = useMemo((): HouseFromApi | undefined => {
    const full = tenantHouses.find((h) => h.id === buildingId);
    if (full) return full;
    return {
      id: buildingId,
      userRentalId: null,
      name: buildingName,
      address: buildingAddress,
      description,
      ward,
      commune,
      city,
      status,
      functionalAreas: routeFunctionalAreas ?? [],
    };
  }, [
    tenantHouses,
    buildingId,
    buildingName,
    buildingAddress,
    description,
    ward,
    commune,
    city,
    status,
    routeFunctionalAreas,
  ]);

  const { data: functionalAreasRes } = useFunctionalAreasByHouseId(buildingId);

  const effectiveFunctionalAreas = useMemo((): FunctionalAreaFromApi[] => {
    return mergeFunctionalAreasForHouse(houseForMerge, functionalAreasRes?.data);
  }, [houseForMerge, functionalAreasRes?.data]);

  const floorOptions = useMemo(() => {
    const fk = (a: FunctionalAreaFromApi) => String(a.floorNo ?? "").trim() || "1";
    const floors = new Set(effectiveFunctionalAreas.map(fk));
    return Array.from(floors).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [effectiveFunctionalAreas]);

  const areasOnSelectedFloor = useMemo(() => {
    const fk = (a: FunctionalAreaFromApi) => String(a.floorNo ?? "").trim() || "1";
    return effectiveFunctionalAreas.filter((a) => fk(a) === deviceFloor);
  }, [effectiveFunctionalAreas, deviceFloor]);

  useEffect(() => {
    if (floorOptions.length && !floorOptions.includes(deviceFloor)) {
      setDeviceFloor(floorOptions[0]!);
    }
  }, [floorOptions, deviceFloor]);

  useEffect(() => {
    setSelectedFunctionAreaId(null);
  }, [deviceFloor, buildingId]);

  const {
    data: itemsData,
    isLoading: loadingItems,
  } = useAssetItems({ houseId: buildingId });

  const devices: AssetItemFromApi[] = useMemo(
    () => asAssetItemArray(itemsData?.data).filter((item) => item.houseId === buildingId),
    [itemsData?.data, buildingId]
  );

  const { data: categoriesData } = useAssetCategories();
  const categories: AssetCategoryFromApi[] = categoriesData?.data ?? [];

  const rawItemsByArea = useMemo(() => {
    if (selectedFunctionAreaId == null) return devices;
    return devices.filter((d) => d.functionAreaId === selectedFunctionAreaId);
  }, [devices, selectedFunctionAreaId]);

  useEffect(() => {
    const prev = prevSelectedAreaRef.current;
    if (selectedFunctionAreaId != null && selectedFunctionAreaId !== prev) {
      const timer = setTimeout(() => {
        setDropdownExpandSignal((n) => n + 1);
      }, 280);
      prevSelectedAreaRef.current = selectedFunctionAreaId;
      return () => clearTimeout(timer);
    }
    prevSelectedAreaRef.current = selectedFunctionAreaId;
  }, [selectedFunctionAreaId]);

  useEffect(() => {
    setSelectedCategoryId(null);
  }, [buildingId, selectedFunctionAreaId, deviceFloor]);

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

  const deviceDropdownSections = useMemo((): DropdownBoxSection[] | null => {
    if (!categoryFilterSection) return null;
    return deviceFilterSection
      ? [categoryFilterSection, deviceFilterSection]
      : [categoryFilterSection];
  }, [categoryFilterSection, deviceFilterSection]);

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
      navigation.navigate("TenantItemDetail", { item: found });
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

  const isCurrentMainOnServer =
    profileMainHouseId.length > 0 && profileMainHouseId === buildingId;
  const showSetMainButton =
    !profilePending && tenantHouses.length > 0 && !isCurrentMainOnServer;

  const openPaymentForHouse = useCallback(() => {
    navigation.navigate("TenantInvoiceList");
  }, [navigation]);

  const openContractPdf = useCallback(
    async (title: string, pdfUrl: string) => {
      const url = String(pdfUrl ?? "").trim();
      if (!url) return;
      try {
        await WebBrowser.openBrowserAsync(url);
      } catch {
        Alert.alert(t("home.house_detail.contract_open_error_title"), title);
      }
    },
    [t]
  );

  const goHome = () => {
    try {
      navigation.navigate("Main");
    } catch {
      /* ignore */
    }
  };

  const handlePickHouse = useCallback(
    async (selectedHouseId: string) => {
      if (!selectedHouseId || isSubmittingMainHouse) return;
      const nextHouse = tenantHouses.find((h) => h.id === selectedHouseId);
      if (!nextHouse) return;

      if (hasPersistedMainHouse) {
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        await queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY });
        navigation.replace("BuildingDetail", houseFromApiToBuildingDetail(nextHouse));
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
        navigation.replace("BuildingDetail", houseFromApiToBuildingDetail(nextHouse));
      } catch {
        Alert.alert(
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
      hasPersistedMainHouse,
      isSubmittingMainHouse,
      mutateMainHouseAsync,
      navigation,
      queryClient,
      refetchHouses,
      setHouseId,
      t,
      tenantHouses,
    ]
  );

  const handleSetMainHouseThis = useCallback(async () => {
    if (!buildingId || isSubmittingMainHouse) return;
    if (isCurrentMainOnServer) return;
    try {
      setIsSubmittingMainHouse(true);
      await mutateMainHouseAsync({ houseId: buildingId });
      Alert.alert(
        t("common.success"),
        t("home.house_detail.main_house_saved"),
        [{ text: t("common.close"), style: "default" }],
        { type: "success" }
      );
    } catch {
      Alert.alert(
        t("home.main_house_update_failed_title"),
        t("home.main_house_update_failed_message"),
        [{ text: t("common.close"), style: "default" }],
        { type: "error" }
      );
    } finally {
      setIsSubmittingMainHouse(false);
    }
  }, [
    buildingId,
    isCurrentMainOnServer,
    isSubmittingMainHouse,
    mutateMainHouseAsync,
    t,
  ]);

  return (
    <View style={tenantHouseStyles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <Pressable onPress={goHome}>
              <StackScreenTitleBadge numberOfLines={1}>
                {t("home.house_detail_screen_title")}
              </StackScreenTitleBadge>
            </Pressable>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + 56}
        enabled={Platform.OS === "ios"}
      >
        <ScrollView
          ref={planScrollRef}
          style={tenantHouseStyles.content}
          contentContainerStyle={[
            tenantHouseStyles.contentContainer,
            {
              paddingBottom:
                tenantHouseStyles.contentContainer.paddingBottom +
                insets.bottom +
                keyboardExtraBottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
        <View style={tenantHouseStyles.card}>
          <Text style={tenantHouseStyles.houseName}>{buildingName}</Text>
          <View style={tenantHouseStyles.houseRow}>
            <Text style={tenantHouseStyles.houseLabel}>{t("home.house_info.address")}</Text>
            <ExpandableLongText
              text={buildingAddress}
              maxLength={DEFAULT_BE_SHORT_TEXT_MAX_CHARS}
              textStyle={tenantHouseStyles.houseValue}
              containerStyle={{ flex: 1 }}
            />
          </View>
          {description ? (
            <View style={tenantHouseStyles.houseRow}>
              <Text style={tenantHouseStyles.houseLabel}>{t("home.house_info.description")}</Text>
              <ExpandableLongText
                text={description}
                maxLength={DEFAULT_BE_SHORT_TEXT_MAX_CHARS}
                textStyle={tenantHouseStyles.houseValue}
                containerStyle={{ flex: 1 }}
              />
            </View>
          ) : null}
          <View style={tenantHouseStyles.houseRow}>
            <Text style={tenantHouseStyles.houseLabel}>{t("home.house_info.status")}</Text>
            <Text
              style={[
                tenantHouseStyles.houseValue,
                {
                  color: isTenantHouseStatusHighlighted(status)
                    ? brandPrimary
                    : neutral.textSecondary,
                },
              ]}
            >
              {formatHouseStatusForDisplay(status, t)}
            </Text>
          </View>

          <View style={tenantHouseStyles.actionsRow}>
            {tenantHouses.length > 1 ? (
              <TouchableOpacity
                style={[homeStyles.switchHouseButton, { flex: 1 }]}
                onPress={() => setHouseModalVisible(true)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "center" }}>
                  <Text style={homeStyles.switchHouseText}>{t("home.switch_house")}</Text>
                  <Icons.chevronForward size={16} color={brandSecondary} />
                </View>
              </TouchableOpacity>
            ) : null}

            {isCurrentMainOnServer ? (
              <View style={[tenantHouseStyles.mainHouseBadge, tenantHouseStyles.mainHouseBadgeOnly]}>
                <Text style={tenantHouseStyles.mainHouseBadgeText}>
                  {t("home.house_detail.main_house_current_label")}
                </Text>
              </View>
            ) : showSetMainButton ? (
              <TouchableOpacity
                style={tenantHouseStyles.setMainButton}
                onPress={handleSetMainHouseThis}
                disabled={isSubmittingMainHouse}
                activeOpacity={0.85}
              >
                {isSubmittingMainHouse ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={tenantHouseStyles.setMainButtonText}>
                    {t("home.house_detail.set_main_house")}
                  </Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={tenantHouseStyles.housePlanSectionWrap}>
          <View style={homeStyles.homeZoneCard}>
            {deviceDropdownSections ? (
              <View
                ref={deviceCategoryFilterMeasureRef}
                onLayout={(e) => {
                  deviceCategoryFilterYRef.current = e.nativeEvent.layout.y;
                }}
              >
                <DropdownBox
                  sections={deviceDropdownSections}
                  summary={categoryFilterSummary}
                  onSelect={handleHouseDropdownSelect}
                  style={{ marginTop: 0, marginHorizontal: 0, marginBottom: 14 }}
                  keyboardVerticalOffset={insets.top + 56}
                  onSearchInputFocus={scrollDeviceCategoryFilterIntoView}
                  onSearchChange={setDeviceSearchQuery}
                  searchAutoFocus={false}
                  expandSignal={dropdownExpandSignal}
                  onExpandedChange={onDeviceDropdownExpandedChange}
                  triggerAccent
                />
              </View>
            ) : null}

            <View style={homeStyles.areaSectionTopRow}>
              <View style={homeStyles.areaSectionTitles}>
                <Text style={homeStyles.areaSectionTitle}>
                  {t("home.device_list.by_area_title")}
                </Text>
                <Text style={homeStyles.areaSectionSubtitle}>{t("home.area_subtitle")}</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={[homeStyles.deviceFloorScroll, homeStyles.floorChipsRow]}
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
                      activeOpacity={0.85}
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
            </View>

            {areasOnSelectedFloor.length > 0 ? (
              <FloorPlanView
                selectedFloor={deviceFloor}
                selectedAreaId={selectedFunctionAreaId ?? "all"}
                functionalAreas={effectiveFunctionalAreas}
                onSelectArea={(id) =>
                  setSelectedFunctionAreaId((prev) => (prev === id ? null : id))
                }
                accentColor={brandPrimary}
                containerStyle={homeStyles.floorPlanInCard}
              />
            ) : loadingItems ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={brandPrimary} />
            ) : null}

            {!loadingItems && devices.length === 0 ? (
              <Text style={tenantHouseStyles.housePlanEmptyText}>
                {t("staff_building_detail.no_devices")}
              </Text>
            ) : null}

            {!loadingItems &&
            devices.length > 0 &&
            filteredDeviceRows.length === 0 ? (
              <Text style={tenantHouseStyles.housePlanEmptyText}>
                {t("staff_home.all_devices_no_items")}
              </Text>
            ) : null}
          </View>
        </View>

        {showPaymentBanner ? (
          <View style={tenantHouseStyles.paymentBanner}>
            <Text style={tenantHouseStyles.paymentBannerText}>
              {t("home.house_detail.unpaid_invoice_banner")}
            </Text>
            <TouchableOpacity
              style={tenantHouseStyles.paymentBannerBtn}
              onPress={openPaymentForHouse}
              activeOpacity={0.85}
            >
              <Text style={tenantHouseStyles.paymentBannerBtnText}>
                {t("home.access.pay_now")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {contractDocuments && contractDocuments.length > 0 ? (
          <View style={[tenantHouseStyles.card, { marginTop: 16 }]}>
            <Text style={tenantHouseStyles.contractsSectionTitle}>
              {t("home.house_detail.contracts_title")}
            </Text>
            {(contractDocuments ?? []).map((doc, index) => (
              <TouchableOpacity
                key={doc.id ?? doc.pdfUrl ?? String(index)}
                style={[
                  tenantHouseStyles.contractLinkRow,
                  index === (contractDocuments?.length ?? 0) - 1
                    ? tenantHouseStyles.contractLinkRowLast
                    : null,
                ]}
                onPress={() => openContractPdf(doc.title, doc.pdfUrl)}
                activeOpacity={0.75}
              >
                <View style={{ marginRight: 10 }}>
                  <Icons.contract size={20} color={brandPrimary} />
                </View>
                <Text style={tenantHouseStyles.contractLinkText} numberOfLines={2}>
                  {doc.title}
                </Text>
                <Icons.chevronForward size={18} color={brandPrimary} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={houseModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHouseModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setHouseModalVisible(false)}>
          <View style={homeStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={homeStyles.modalContent}>
                <Text style={homeStyles.modalTitle}>{t("home.select_main_house")}</Text>
                <FlatList
                  data={tenantHouses}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        homeStyles.houseItem,
                        item.id === houseId && homeStyles.houseItemActive,
                      ]}
                      onPress={() => handlePickHouse(item.id)}
                      disabled={isSubmittingMainHouse}
                    >
                      <Text
                        style={[
                          homeStyles.houseItemText,
                          item.id === houseId && homeStyles.houseItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSubmittingMainHouse && item.id === pendingMainHouseId ? (
                        <ActivityIndicator size="small" color={brandPrimary} />
                      ) : item.id === houseId ? (
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
    </View>
  );
};

export default TenantHouseDescription;
