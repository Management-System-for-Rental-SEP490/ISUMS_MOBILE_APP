/**
 * Màn chi tiết thiết bị cho tenant: nhận item từ danh sách, fetch lại theo id khi focus,
 * hiển thị giống staff ItemDescription (nhà, danh mục, tên, serial, NFC, QR, tình trạng, trạng thái).
 * Có nút "Báo cáo sự cố" chuyển sang Ticket.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  FlatList,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { RootStackParamList } from "../../../../shared/types";
import type { DeviceStatus } from "../../../../shared/types";
import type { AssetItemFromApi } from "../../../../shared/types/api";
import { normalizeAssetItemStatusFromApi } from "../../../../shared/types/api";
import Icons from "../../../../shared/theme/icon";
import {
  useAssetCategoryById,
  useAssetCategories,
  useFunctionalAreasByHouseId,
  useTenantContext,
} from "../../../../shared/hooks";
import {
  formatDayMonthNumeric,
  getTenantAccessBlock,
  mergeFunctionalAreasForHouse,
  translateTenantAccessReason,
} from "../../../../shared/utils";
import { tenantItemDescriptionStyles as itemScreenStyles } from "./tenantItemDescriptionStyles";
import {
  getAssetItemById,
  getAssetItemImages,
  type AssetItemImageFromApi,
} from "../../../../shared/services/assetItemApi";

function normalizeEmbeddedImages(
  images: AssetItemImageFromApi[] | undefined
): AssetItemImageFromApi[] {
  if (!images?.length) return [];
  return images
    .map((img) => ({
      id: String(img.id ?? "").trim(),
      url: String(img.url ?? ""),
      createdAt: img.createdAt ?? null,
    }))
    .filter((x) => x.id.length > 0 && x.url.length > 0);
}
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import { neutral } from "../../../../shared/theme/color";
import { RefreshLogoInline, RefreshLogoOverlay } from "@shared/components/RefreshLogoOverlay";
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

type NavProp = NativeStackNavigationProp<RootStackParamList, "TenantItemDetail">;
type RoutePropType = RouteProp<RootStackParamList, "TenantItemDetail">;

function mapApiStatusToDeviceStatus(apiStatus: string): DeviceStatus {
  const raw = apiStatus != null ? String(apiStatus).trim() : "";
  if (raw === "MAINTENANCE") return "maintenance";
  const normalized = normalizeAssetItemStatusFromApi(apiStatus);
  switch (normalized) {
    case "IN_USE":
    case "ACTIVE":
      return "active";
    case "DISPOSED":
    case "BROKEN":
      return "inactive";
    default:
      return "pending";
  }
}

export default function TenantItemDescriptionScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { house } = useTenantContext();
  const accessBlock = useMemo(() => getTenantAccessBlock(house), [house]);
  const { data: categoriesData } = useAssetCategories();
  const categories = categoriesData?.data ?? [];

  const initialItem = route.params.item;
  const [item, setItem] = useState<AssetItemFromApi>(initialItem);
  const [loading, setLoading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [itemImages, setItemImages] = useState<AssetItemImageFromApi[]>(() =>
    normalizeEmbeddedImages(initialItem.images)
  );
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);
  const imageModalListRef = useRef<FlatList<AssetItemImageFromApi>>(null);
  const { width: windowWidth } = useWindowDimensions();
  const imageModalPageWidth = Math.max(0, windowWidth - 32);

  const houseIdForAreas = String(item.houseId ?? "").trim();
  const { data: functionalAreasByHouseRes } =
    useFunctionalAreasByHouseId(houseIdForAreas, !accessBlock);

  const placementFunctionalAreas = useMemo(
    () =>
      mergeFunctionalAreasForHouse(
        house?.id === item.houseId ? house : undefined,
        functionalAreasByHouseRes?.data
      ),
    [house, item.houseId, functionalAreasByHouseRes?.data]
  );

  useFocusEffect(
    useCallback(() => {
      if (accessBlock) return;
      let isActive = true;
      (async () => {
        try {
          setLoading(true);
          setImagesLoading(true);
          const latest = await getAssetItemById(initialItem.id);
          if (!isActive) return;
          if (latest) {
            if (!latest.nfcTag && initialItem.nfcTag) latest.nfcTag = initialItem.nfcTag;
            if (!latest.qrTag && initialItem.qrTag) latest.qrTag = initialItem.qrTag;
            setItem(latest);
            const embedded = normalizeEmbeddedImages(latest.images);
            if (embedded.length > 0) {
              setItemImages(embedded);
            } else {
              try {
                const imgs = await getAssetItemImages(initialItem.id);
                if (isActive) setItemImages(imgs);
              } catch {
                if (isActive) setItemImages([]);
              }
            }
          } else {
            try {
              const imgs = await getAssetItemImages(initialItem.id);
              if (isActive) setItemImages(imgs);
            } catch {
              if (isActive) setItemImages([]);
            }
          }
        } catch {
          /* giữ dữ liệu từ route */
        } finally {
          if (isActive) {
            setLoading(false);
            setImagesLoading(false);
          }
        }
      })();
      return () => {
        isActive = false;
      };
    }, [accessBlock, initialItem.id, initialItem.nfcTag, initialItem.qrTag])
  );

  useEffect(() => {
    if (activeImageIndex == null || itemImages.length === 0) return;
    const index = Math.min(Math.max(0, activeImageIndex), itemImages.length - 1);
    const timer = setTimeout(() => {
      imageModalListRef.current?.scrollToIndex({ index, animated: false });
    }, 0);
    return () => clearTimeout(timer);
  }, [activeImageIndex, itemImages]);

  const houseName = house?.id === item.houseId ? house.name : item.houseId;
  const {
    data: categoryByIdRes,
  } = useAssetCategoryById(item.categoryId);
  const categoryName =
    categories.find((c) => c.id === item.categoryId)?.name ??
    categoryByIdRes?.data?.name ??
    item.categoryId;

  const placementDisplay = useMemo(() => {
    const fid = item.functionAreaId;
    if (!fid || !String(fid).trim()) return "—";
    const a = placementFunctionalAreas.find((x) => x.id === fid);
    if (a) {
      const floorPart = (a.floorNo ?? "").trim()
        ? t("staff_building_detail.functional_area_floor", { floor: a.floorNo })
        : "";
      return [a.name, floorPart].filter(Boolean).join(" · ");
    }
    return t("staff_item_create.function_area_unknown");
  }, [item.functionAreaId, placementFunctionalAreas, t]);

  const getStatusStyle = () => {
    const normalizedStatus = normalizeAssetItemStatusFromApi(item.status);
    if (normalizedStatus === "IN_USE" || normalizedStatus === "ACTIVE") {
      return itemScreenStyles.descriptionStatusInUse;
    }
    if (normalizedStatus === "BROKEN") {
      return itemScreenStyles.descriptionStatusBroken;
    }
    if (normalizedStatus === "DISPOSED") {
      return itemScreenStyles.descriptionStatusDisposed;
    }
    return itemScreenStyles.descriptionStatusOther;
  };

  const getStatusLabel = () => {
    const normalizedStatus = normalizeAssetItemStatusFromApi(item.status);
    if (normalizedStatus === "IN_USE") return t("staff_item_create.status_in_use");
    if (normalizedStatus === "ACTIVE") return t("staff_item_create.status_active");
    if (normalizedStatus === "DISPOSED") return t("staff_item_create.status_disposed");
    if (normalizedStatus === "BROKEN") return t("staff_item_create.status_broken");
    return normalizedStatus ?? "—";
  };

  let nfcValue = (item.nfcTag || "").trim();
  let qrValue = (item.qrTag || "").trim();
  if (!nfcValue && !qrValue && Array.isArray(item.tags) && item.tags.length > 0) {
    const nfcObj = item.tags.find((t) => t.tagType === "NFC");
    const qrObj = item.tags.find((t) => t.tagType === "QR_CODE");
    if (nfcObj) nfcValue = nfcObj.tagValue;
    if (qrObj) qrValue = qrObj.tagValue;
  }

  const rows: { label: string; value: string }[] = [
    { label: t("staff_item_create.house_label"), value: houseName ?? "—" },
    { label: t("staff_item_create.function_area_label"), value: placementDisplay },
    { label: t("staff_item_create.category_label"), value: categoryName },
    { label: t("staff_item_create.display_name_label"), value: item.displayName ?? "—" },
    { label: t("staff_item_create.serial_number_label"), value: item.serialNumber ?? "—" },
    { label: t("device_detail.nfc_tag_id"), value: nfcValue || "—" },
    { label: t("device_detail.qr_code_id"), value: qrValue || "—" },
    { label: t("staff_item_create.condition_label"), value: `${item.conditionPercent ?? 0}%` },
  ];

  const isDifferentHouse = house && item.houseId !== house.id;
  const accessBlockBody = useMemo(() => {
    if (!accessBlock) return "";
    const reason = translateTenantAccessReason(house?.accessReason, house?.accessStatus, t);
    if (accessBlock === "handover") {
      return (
        reason ||
        t("home.access.handover_body", {
          date: house?.handoverDate
            ? formatDayMonthNumeric(new Date(house.handoverDate), i18n.language)
            : "—",
        })
      );
    }
    if (accessBlock === "deposit") return reason || t("home.access.deposit_body");
    if (accessBlock === "payment_restricted") {
      return reason || t("home.access.payment_restricted_banner");
    }
    return reason;
  }, [
    accessBlock,
    house?.accessReason,
    house?.accessStatus,
    house?.handoverDate,
    t,
    i18n.language,
  ]);

  return (
    <View style={itemScreenStyles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icons.chevronBack size={24} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>
              {t("device_detail.title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      {isDifferentHouse && (
        <View style={itemScreenStyles.errorBanner}>
          <Text style={itemScreenStyles.errorBannerText}>
            {t("common.warning_different_house", { houseName: houseName || item.houseId })}
          </Text>
        </View>
      )}

      {accessBlock ? (
        <View style={itemScreenStyles.errorBanner}>
          <Text style={itemScreenStyles.errorBannerText}>
            {accessBlockBody}
          </Text>
        </View>
      ) : null}

      {accessBlock ? null : loading ? (
        <View style={{ flex: 1, position: "relative" }}>
          <RefreshLogoOverlay visible mode="page" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            itemScreenStyles.scrollContent,
            { paddingBottom: 24 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={itemScreenStyles.descriptionCard}>
            <Text style={itemScreenStyles.descriptionTitle} numberOfLines={2}>
              {item.displayName ?? item.serialNumber ?? item.id}
            </Text>

            {rows.map((row, index) => (
              <View
                key={row.label}
                style={[
                  itemScreenStyles.descriptionRow,
                  index === rows.length - 1 && itemScreenStyles.descriptionRowLast,
                ]}
              >
                <Text style={itemScreenStyles.descriptionLabel}>{row.label}</Text>
                <Text style={itemScreenStyles.descriptionValue} numberOfLines={2}>
                  {row.value}
                </Text>
              </View>
            ))}

            <View
              style={[
                itemScreenStyles.descriptionRow,
                itemScreenStyles.descriptionRowLast,
              ]}
            >
              <Text style={itemScreenStyles.descriptionLabel}>
                {t("staff_item_create.status_label")}
              </Text>
              <View
                style={[
                  itemScreenStyles.descriptionStatusBadge,
                  getStatusStyle(),
                ]}
              >
                <Text
                  style={[
                    itemScreenStyles.descriptionValue,
                    { textAlign: "center", flex: undefined },
                  ]}
                >
                  {getStatusLabel()}
                </Text>
              </View>
            </View>

            <View style={itemScreenStyles.imagesSection}>
              <Text style={itemScreenStyles.imagesLabel}>{t("device_detail.images_label")}</Text>
              {imagesLoading ? (
                <View style={{ alignItems: "flex-start", paddingVertical: 8 }}>
                  <RefreshLogoInline logoPx={18} showLabel />
                </View>
              ) : itemImages.length > 0 ? (
                <>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={itemScreenStyles.imageStripScroll}
                    contentContainerStyle={itemScreenStyles.imageStrip}
                  >
                    {itemImages.map((img, index) => (
                      <TouchableOpacity
                        key={img.id}
                        style={[itemScreenStyles.imageThumb, itemScreenStyles.imageThumbHorizontal]}
                        activeOpacity={0.85}
                        onPress={() => setActiveImageIndex(index)}
                      >
                        <Image source={{ uri: img.url }} style={itemScreenStyles.imageThumbImg} resizeMode="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <Text style={itemScreenStyles.imagesHint}>{t("device_detail.images_empty")}</Text>
              )}
            </View>

            <TouchableOpacity
              style={itemScreenStyles.descriptionEditBtn}
              onPress={() => {
                const hid = String(item.houseId ?? house?.id ?? "").trim();
                if (!hid) {
                  Alert.alert(t("ticket.validation_error_title"), t("ticket.house_missing"));
                  return;
                }
                navigation.navigate("Ticket", {
                  houseId: hid,
                  presetAsset: {
                    id: item.id,
                    displayName: (item.displayName ?? "").trim() || item.id,
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <View style={itemScreenStyles.descriptionEditBtnContentRow}>
                <Icons.warning size={20} color={neutral.surface} />
                <Text style={itemScreenStyles.descriptionEditBtnText}>
                  {t("device_detail.report_button")}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={activeImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveImageIndex(null)}
      >
        <View style={itemScreenStyles.imageModalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
            style={itemScreenStyles.imageModalBackdropDismiss}
            onPress={() => setActiveImageIndex(null)}
          />
          <View style={itemScreenStyles.imageModalContent}>
            <TouchableOpacity
              style={itemScreenStyles.imageModalClose}
              activeOpacity={0.8}
              onPress={() => setActiveImageIndex(null)}
            >
              <Text style={itemScreenStyles.imageModalCloseText}>×</Text>
            </TouchableOpacity>
            {activeImageIndex !== null && itemImages.length > 0 ? (
              <FlatList
                ref={imageModalListRef}
                data={itemImages}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                style={itemScreenStyles.imageModalPager}
                keyExtractor={(item) => item.id}
                getItemLayout={(_, index) => ({
                  length: imageModalPageWidth,
                  offset: imageModalPageWidth * index,
                  index,
                })}
                renderItem={({ item }) => (
                  <View style={{ width: imageModalPageWidth, flex: 1 }}>
                    <Image
                      source={{ uri: item.url }}
                      style={itemScreenStyles.imageModalImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    imageModalListRef.current?.scrollToIndex({
                      index: info.index,
                      animated: false,
                    });
                  }, 100);
                }}
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}
