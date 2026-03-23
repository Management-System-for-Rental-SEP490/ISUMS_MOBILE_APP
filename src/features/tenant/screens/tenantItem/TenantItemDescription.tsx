/**
 * Màn chi tiết thiết bị cho tenant: nhận item từ danh sách, fetch lại theo id khi focus,
 * hiển thị giống staff ItemDescription (nhà, danh mục, tên, serial, NFC, QR, tình trạng, trạng thái).
 * Có nút "Báo cáo sự cố" chuyển sang Ticket.
 */
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
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
import { mergeFunctionalAreasForHouse } from "../../../../shared/utils";
import { tenantItemDescriptionStyles as itemScreenStyles } from "./tenantItemDescriptionStyles";
import { getAssetItemById } from "../../../../shared/services/assetItemApi";
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import { brandPrimary, neutral } from "../../../../shared/theme/color";
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
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const { house } = useTenantContext();
  const { data: categoriesData } = useAssetCategories();
  const categories = categoriesData?.data ?? [];

  const initialItem = route.params.item;
  const [item, setItem] = useState<AssetItemFromApi>(initialItem);
  const [loading, setLoading] = useState(false);

  const houseIdForAreas = String(item.houseId ?? "").trim();
  const { data: functionalAreasByHouseRes } =
    useFunctionalAreasByHouseId(houseIdForAreas);

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
      let isActive = true;
      const fetchLatest = async () => {
        try {
          setLoading(true);
          const latest = await getAssetItemById(initialItem.id);
          if (isActive && latest) {
            if (!latest.nfcTag && initialItem.nfcTag) latest.nfcTag = initialItem.nfcTag;
            if (!latest.qrTag && initialItem.qrTag) latest.qrTag = initialItem.qrTag;
            setItem(latest);
          }
        } catch {
          /* giữ dữ liệu từ route */
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchLatest();
      return () => { isActive = false; };
    }, [initialItem.id])
  );

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
    if (normalizedStatus === "DISPOSED" || normalizedStatus === "BROKEN") {
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
  if (!nfcValue && !qrValue && item.tags?.length) {
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

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={brandPrimary} />
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
    </View>
  );
}
