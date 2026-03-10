/**
 * Màn chi tiết thiết bị cho tenant: nhận item từ danh sách, fetch lại theo id khi focus,
 * hiển thị giống staff ItemDescription (nhà, danh mục, tên, serial, NFC, QR, tình trạng, trạng thái).
 * Có nút "Báo cáo sự cố" chuyển sang Ticket.
 */
import React, { useCallback, useState } from "react";
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
import type { Device, DeviceStatus } from "../../../../shared/types";
import type { AssetItemFromApi } from "../../../../shared/types/api";
import Icons from "../../../../shared/theme/icon";
import { useTenantContext } from "../../../../shared/hooks";
import { useAssetCategories } from "../../../../shared/hooks";
import { itemScreenStyles } from "../../../staff/screens/staffItems/itemScreenStyles";
import { getAssetItemById } from "../../../../shared/services/assetItemApi";

type NavProp = NativeStackNavigationProp<RootStackParamList, "TenantItemDetail">;
type RoutePropType = RouteProp<RootStackParamList, "TenantItemDetail">;

function mapApiStatusToDeviceStatus(apiStatus: string): DeviceStatus {
  switch (apiStatus) {
    case "AVAILABLE":
    case "IN_USE":
      return "active";
    case "DISPOSED":
      return "inactive";
    case "MAINTENANCE":
      return "maintenance";
    default:
      return "pending";
  }
}

function mapAssetItemToDevice(
  item: AssetItemFromApi,
  houseName?: string | null
): Device {
  return {
    id: item.id,
    name: item.displayName,
    type: "other",
    nfcTagId: item.nfcTag ?? "",
    location: houseName ?? "",
    status: mapApiStatusToDeviceStatus(item.status),
    metadata: {
      serialNumber: item.serialNumber,
      manufacturer: "",
      model: "",
      installationDate: "",
    },
  };
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
        } catch (e) {
          console.log("Error fetching item:", e);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchLatest();
      return () => { isActive = false; };
    }, [initialItem.id])
  );

  const houseName = house?.id === item.houseId ? house.name : item.houseId;
  const categoryName =
    categories.find((c) => c.id === item.categoryId)?.name ?? item.categoryId;

  const getStatusStyle = () => {
    if (item.status === "AVAILABLE") return itemScreenStyles.descriptionStatusAvailable;
    if (item.status === "IN_USE") return itemScreenStyles.descriptionStatusInUse;
    if (item.status === "DISPOSED") return itemScreenStyles.descriptionStatusDisposed;
    return itemScreenStyles.descriptionStatusOther;
  };

  const getStatusLabel = () => {
    if (item.status === "AVAILABLE") return t("staff_item_create.status_available");
    if (item.status === "IN_USE") return t("staff_item_create.status_in_use");
    if (item.status === "DISPOSED") return t("staff_item_create.status_disposed");
    return item.status ?? "—";
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
    { label: t("staff_item_create.category_label"), value: categoryName },
    { label: t("staff_item_create.display_name_label"), value: item.displayName ?? "—" },
    { label: t("staff_item_create.serial_number_label"), value: item.serialNumber ?? "—" },
    { label: t("device_detail.nfc_tag_id"), value: nfcValue || "—" },
    { label: t("device_detail.qr_code_id"), value: qrValue || "—" },
    { label: t("staff_item_create.condition_label"), value: `${item.conditionPercent ?? 0}%` },
  ];

  const safeStyle = { paddingTop: insets.top, paddingBottom: insets.bottom };

  return (
    <View style={[itemScreenStyles.container, safeStyle]}>
      <View style={itemScreenStyles.topBar}>
        <TouchableOpacity
          style={itemScreenStyles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icons.chevronBack size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={itemScreenStyles.topBarTitle} numberOfLines={1}>
          {t("device_detail.title")}
        </Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#60A5FA" />
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
              onPress={() =>
                navigation.navigate("Ticket", {
                  device: mapAssetItemToDevice(item, houseName),
                })
              }
              activeOpacity={0.8}
            >
              <Text style={itemScreenStyles.descriptionEditBtnText}>
                {t("device_detail.report_button")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
