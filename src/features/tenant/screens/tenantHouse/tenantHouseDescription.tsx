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
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
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
import type { HouseFromApi, UserProfileResponse } from "../../../../shared/types/api";
import tenantHouseStyles from "./tenantHouseStyles";
import { RefreshLogoInline } from "@shared/components/RefreshLogoOverlay";
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
import { toAppLocaleCode } from "../../../../shared/utils/resolveLocalizedJsonString";
import {
  HOUSES_KEYS,
  useUpdateMainHouseMutation,
  useAssetItems,
  asAssetItemArray,
  useHouseById,
  USER_KEYS,
} from "../../../../shared/hooks";
import type { HousesApiResponse } from "../../../../shared/types/api";
import { useAuthStore } from "../../../../store/useAuthStore";
import {
  DropdownBox,
  type DropdownBoxSection,
} from "../../../../shared/components/dropdownBox";
import { FloorPlanView } from "../../houseStructure";
import type { AssetItemFromApi, FunctionalAreaFromApi } from "../../../../shared/types/api";
import { normalizeAssetItemStatusFromApi } from "../../../../shared/types/api";
import {
  DROPDOWN_SEARCH_TOP_INSET_PX,
  isFieldObscuredByKeyboard,
  parentScrollOffsetForDropdownField,
} from "../../../../shared/utils";

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

/** Tên danh mục từ object `category` embed trong GET items/house (không cần GET /categories). */
function assetCategoryDisplayName(item: AssetItemFromApi): string {
  const embedded = item.category?.name;
  if (embedded != null && String(embedded).trim().length > 0) {
    return String(embedded).trim();
  }
  return String(item.categoryId ?? "").trim();
}

const TenantHouseDescription = () => {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<TenantHouseNavProp>();
  const route = useRoute<TenantHouseRouteProp>();
  const queryClient = useQueryClient();
  const { houseId, setHouseId } = useAuthStore();
  const locale = toAppLocaleCode(i18n.language);

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
    contractDocuments: routeContractDocuments,
    pendingInvoiceId,
    accessStatus: routeAccessStatus,
    accessReason: routeAccessReason,
    memberRole: routeMemberRole,
    hasUnpaidInvoice: routeHasUnpaidInvoice,
  } = route.params;

  /** Duy nhất request khi vào màn: GET /api/houses/{id} (đã gồm functionalAreas, images, …). */
  const { data: houseByIdRes, isLoading: houseDetailLoading } = useHouseById(
    buildingId,
    Boolean(buildingId)
  );
  const detailHouse = houseByIdRes?.success ? houseByIdRes.data : null;

  const currentHouse = useMemo((): HouseFromApi => {
    const pick = (...values: Array<string | null | undefined>) => {
      for (const value of values) {
        const text = String(value ?? "").trim();
        if (text.length > 0) return text;
      }
      return "";
    };

    return {
      id: buildingId,
      userRentalId: detailHouse?.userRentalId ?? null,
      regionId: detailHouse?.regionId ?? null,
      name: pick(detailHouse?.name, buildingName),
      address: pick(detailHouse?.address, buildingAddress),
      description: pick(detailHouse?.description, description),
      ward: pick(detailHouse?.ward, ward),
      commune: pick(detailHouse?.commune, commune),
      city: pick(detailHouse?.city, city),
      status: detailHouse?.status ?? status,
      functionalAreas: detailHouse?.functionalAreas ?? routeFunctionalAreas ?? [],
      contractDocuments: detailHouse?.contractDocuments ?? routeContractDocuments,
      hasUnpaidInvoice: detailHouse?.hasUnpaidInvoice ?? routeHasUnpaidInvoice,
      pendingInvoiceId: detailHouse?.pendingInvoiceId ?? pendingInvoiceId ?? null,
      accessStatus: detailHouse?.accessStatus ?? routeAccessStatus,
      accessReason: detailHouse?.accessReason ?? routeAccessReason ?? null,
      memberRole: detailHouse?.memberRole ?? routeMemberRole,
      images: detailHouse?.images,
      paymentRestricted: detailHouse?.paymentRestricted,
    };
  }, [
    buildingAddress,
    buildingId,
    buildingName,
    city,
    commune,
    description,
    detailHouse,
    pendingInvoiceId,
    routeAccessReason,
    routeAccessStatus,
    routeContractDocuments,
    routeFunctionalAreas,
    routeHasUnpaidInvoice,
    routeMemberRole,
    status,
    ward,
  ]);

  const houseImages = useMemo(
    () =>
      (currentHouse.images ?? [])
        .map((img) => ({ id: img.id, url: String(img.url ?? "").trim() }))
        .filter((img) => img.url.length > 0),
    [currentHouse.images]
  );

  const showPaymentBanner = useMemo(() => {
    const st = String(currentHouse.accessStatus ?? "").trim().toUpperCase();
    if (st === "PENDING_FIRST_RENT") return true;
    if (currentHouse.hasUnpaidInvoice === true) return true;
    if (currentHouse.paymentRestricted === true) return true;
    return false;
  }, [currentHouse.accessStatus, currentHouse.hasUnpaidInvoice, currentHouse.paymentRestricted]);

  const profileMainHouseId = useMemo(() => {
    const cached = queryClient.getQueryData<UserProfileResponse | null>(
      USER_KEYS.profile()
    );
    return String(cached?.mainHouseId ?? "").trim();
  }, [queryClient]);

  const updateMainHouseMutation = useUpdateMainHouseMutation();
  const mutateMainHouseAsync = updateMainHouseMutation.mutateAsync;

  const [houseModalVisible, setHouseModalVisible] = useState(false);
  const [modalTenantHouses, setModalTenantHouses] = useState<HouseFromApi[]>([]);
  const [isSubmittingMainHouse, setIsSubmittingMainHouse] = useState(false);
  const [pendingMainHouseId, setPendingMainHouseId] = useState<string | null>(null);
  /** Chỉ bật GET /assets/items/house/{id} sau khi user mở dropdown thiết bị lần đầu. */
  const [assetsFetchEnabled, setAssetsFetchEnabled] = useState(false);

  useEffect(() => {
    if (!houseModalVisible) return;
    const cached = queryClient.getQueryData<HousesApiResponse>([
      ...HOUSES_KEYS.tenant,
      locale,
    ]);
    setModalTenantHouses(cached?.data ?? []);
  }, [houseModalVisible, locale, queryClient]);

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
      if (open && !assetsFetchEnabled) {
        setAssetsFetchEnabled(true);
      }
      if (!open) {
        setKeyboardExtraBottom(0);
        return;
      }
      scrollDeviceDropdownOpenIntoView();
    },
    [assetsFetchEnabled, scrollDeviceDropdownOpenIntoView]
  );

  const effectiveFunctionalAreas = useMemo((): FunctionalAreaFromApi[] => {
    return currentHouse.functionalAreas ?? [];
  }, [currentHouse.functionalAreas]);

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
  } = useAssetItems({ houseId: buildingId, enabled: assetsFetchEnabled });

  const devices: AssetItemFromApi[] = useMemo(
    () => asAssetItemArray(itemsData?.data).filter((item) => item.houseId === buildingId),
    [itemsData?.data, buildingId]
  );

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
      for (const [categoryId, groupItems] of map) {
        const sorted = [...groupItems].sort((a, b) =>
          (a.displayName ?? "").localeCompare(b.displayName ?? "", undefined, {
            sensitivity: "base",
          })
        );
        const sample = sorted[0];
        result.push({
          categoryId,
          categoryName: sample
            ? assetCategoryDisplayName(sample)
            : t("staff_building_detail.category_other"),
          items: sorted,
        });
      }
      return result.sort((a, b) =>
        a.categoryName.localeCompare(b.categoryName, undefined, { sensitivity: "base" })
      );
    },
    [t]
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
      items: filteredDeviceRows.map(({ categoryName, item }) => {
        const broken = normalizeAssetItemStatusFromApi(item.status) === "BROKEN";
        return {
          id: item.id,
          label: item.displayName ?? item.id,
          detail: broken
            ? `${categoryName} · ${t("staff_item_create.status_broken")}`
            : categoryName,
          listEmphasis: broken ? ("broken" as const) : undefined,
        };
      }),
    };
  }, [filteredDeviceRows, t]);

  const deviceDropdownSections = useMemo((): DropdownBoxSection[] | null => {
    if (!assetsFetchEnabled) {
      return [
        {
          id: "category",
          title: t("dropdown_box.section_category"),
          itemLayout: "chips",
          items: [],
          selectedId: selectedCategoryId,
          showAllOption: true,
        },
      ];
    }
    if (!categoryFilterSection) return null;
    return deviceFilterSection
      ? [categoryFilterSection, deviceFilterSection]
      : [categoryFilterSection];
  }, [
    assetsFetchEnabled,
    categoryFilterSection,
    deviceFilterSection,
    selectedCategoryId,
    t,
  ]);

  const categoryFilterSummary = t("home.house_detail.devices_dropdown_summary");

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
  const showSetMainButton = !isCurrentMainOnServer;

  const cachedTenantHousesForSwitch = useMemo(() => {
    const cached = queryClient.getQueryData<HousesApiResponse>([
      ...HOUSES_KEYS.tenant,
      locale,
    ]);
    return cached?.data ?? [];
  }, [houseModalVisible, locale, queryClient]);

  const showSwitchHouseButton = cachedTenantHousesForSwitch.length > 1;

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
      const nextHouse = modalTenantHouses.find((h) => h.id === selectedHouseId);
      if (!nextHouse) return;

      const hasPersistedMainHouse =
        profileMainHouseId.length > 0 &&
        modalTenantHouses.some((h) => h.id === profileMainHouseId);

      if (hasPersistedMainHouse) {
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        setAssetsFetchEnabled(false);
        navigation.replace("BuildingDetail", houseFromApiToBuildingDetail(nextHouse));
        return;
      }
      try {
        setIsSubmittingMainHouse(true);
        setPendingMainHouseId(selectedHouseId);
        await mutateMainHouseAsync({ houseId: selectedHouseId });
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        setAssetsFetchEnabled(false);
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
      isSubmittingMainHouse,
      modalTenantHouses,
      mutateMainHouseAsync,
      navigation,
      profileMainHouseId,
      setHouseId,
      t,
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

  if (houseDetailLoading && !detailHouse) {
    return (
      <View style={[tenantHouseStyles.container, { justifyContent: "center", alignItems: "center" }]}>
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
              <StackScreenTitleBadge numberOfLines={1}>
                {t("home.house_detail_screen_title")}
              </StackScreenTitleBadge>
            </View>
            <StackScreenTitleBarBalance />
          </View>
        </StackScreenTitleHeaderStrip>
        <ActivityIndicator size="large" color={brandPrimary} />
        <Text style={{ marginTop: 12, color: neutral.textSecondary }}>{t("common.loading")}</Text>
      </View>
    );
  }

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
          {houseImages.length > 0 ? (
            <>
              <Text style={tenantHouseStyles.houseImagesLabel}>
                {t("home.house_detail.images_label")}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={tenantHouseStyles.houseImagesScroll}
                contentContainerStyle={tenantHouseStyles.houseImagesContent}
              >
                {houseImages.map((img) => (
                  <Image
                    key={img.id}
                    source={{ uri: img.url }}
                    style={tenantHouseStyles.houseImageThumb}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
            </>
          ) : null}
          <Text style={tenantHouseStyles.houseName}>{currentHouse.name}</Text>
          <View style={tenantHouseStyles.houseRow}>
            <Text style={tenantHouseStyles.houseLabel}>{t("home.house_info.address")}</Text>
            <ExpandableLongText
              text={currentHouse.address}
              maxLength={DEFAULT_BE_SHORT_TEXT_MAX_CHARS}
              textStyle={tenantHouseStyles.houseValue}
              containerStyle={{ flex: 1 }}
            />
          </View>
          {currentHouse.description ? (
            <View style={tenantHouseStyles.houseRow}>
              <Text style={tenantHouseStyles.houseLabel}>{t("home.house_info.description")}</Text>
              <ExpandableLongText
                text={currentHouse.description}
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
                  color: isTenantHouseStatusHighlighted(currentHouse.status)
                    ? brandPrimary
                    : neutral.textSecondary,
                },
              ]}
            >
              {formatHouseStatusForDisplay(currentHouse.status, t)}
            </Text>
          </View>

          <View style={tenantHouseStyles.actionsRow}>
            {showSwitchHouseButton ? (
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
                  <RefreshLogoInline logoPx={18} />
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
            <View style={homeStyles.areaSectionTopRow}>
              <View style={homeStyles.areaSectionTitles}>
                <Text style={homeStyles.areaSectionTitle}>
                  {t("home.device_list.by_area_title")}
                </Text>
                <Text style={homeStyles.areaSectionSubtitle}>
                  {t("home.house_detail.area_subtitle")}
                </Text>
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
            ) : null}

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
                  style={{ marginTop: 14, marginHorizontal: 0, marginBottom: 0 }}
                  keyboardVerticalOffset={insets.top + 56}
                  onSearchInputFocus={scrollDeviceCategoryFilterIntoView}
                  onSearchChange={setDeviceSearchQuery}
                  searchAutoFocus={false}
                  defaultExpanded={false}
                  expandSignal={dropdownExpandSignal}
                  onExpandedChange={onDeviceDropdownExpandedChange}
                  triggerAccent
                />
              </View>
            ) : null}

            {assetsFetchEnabled && loadingItems ? (
              <View style={{ marginVertical: 20, alignItems: "center" }}>
                <RefreshLogoInline logoPx={22} showLabel />
              </View>
            ) : null}

            {assetsFetchEnabled && !loadingItems && devices.length === 0 ? (
              <Text style={tenantHouseStyles.housePlanEmptyText}>
                {t("staff_building_detail.no_devices")}
              </Text>
            ) : null}

            {assetsFetchEnabled &&
            !loadingItems &&
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

        {currentHouse.contractDocuments && currentHouse.contractDocuments.length > 0 ? (
          <View style={[tenantHouseStyles.card, { marginTop: 16 }]}>
            <Text style={tenantHouseStyles.contractsSectionTitle}>
              {t("home.house_detail.contracts_title")}
            </Text>
            {(currentHouse.contractDocuments ?? []).map((doc, index) => (
              <TouchableOpacity
                key={doc.id ?? doc.pdfUrl ?? String(index)}
                style={[
                  tenantHouseStyles.contractLinkRow,
                  index === (currentHouse.contractDocuments?.length ?? 0) - 1
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
                  data={modalTenantHouses}
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
                        <RefreshLogoInline logoPx={18} />
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
