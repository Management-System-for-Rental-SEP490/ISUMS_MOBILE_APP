/**
 * Màn hình Chi tiết nhà dành cho Staff.
 * Hiển thị thông tin nhà + danh sách thiết bị từ API GET /api/asset/items (filter theo houseId).
 * Thiết bị chưa có NFC hiển thị nút "Gán mã NFC" (sau này mở luồng quét NFC).
 */
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "../../../shared/types";
import type { Device, AssetItemFromApi, AssetCategoryFromApi } from "../../../shared/types";
import { getAssetItems, getAssetCategories } from "../../../shared/services/houseApi";
import Icons from "../../../shared/theme/icon";
import { staffBuildingDetailStyles } from "../styles/staffBuildingDetailStyles";

type BuildingDetailRouteProp = RouteProp<RootStackParamList, "BuildingDetail">;
type NavProp = NativeStackNavigationProp<RootStackParamList, "BuildingDetail">;

export default function BuildingDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<BuildingDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const {
    buildingId,
    buildingName,
    buildingAddress,
    description,
    ward,
    commune,
    city,
    status,
  } = route.params;

  // Lấy thiết bị thuộc căn nhà này từ API GET /api/asset/items?houseId=...
  const { data: itemsData, isLoading, isError } = useQuery({
    queryKey: ["assetItems", "house", buildingId],
    queryFn: () => getAssetItems({ houseId: buildingId }),
  });
  const rawItems: AssetItemFromApi[] = itemsData?.data ?? [];

  // Danh mục từ API để hiển thị tên và nhóm thiết bị theo category
  const { data: categoriesData } = useQuery({
    queryKey: ["assetCategories"],
    queryFn: getAssetCategories,
  });
  const categories: AssetCategoryFromApi[] = categoriesData?.data ?? [];

  /** Map item từ API sang Device (để dùng chung UI). */
  const itemToDevice = (item: AssetItemFromApi): Device => ({
    id: item.id,
    name: item.displayName,
    type: "other",
    nfcTagId: item.nfcId ?? "",
    location: buildingName ?? "-",
    status:
      item.status === "AVAILABLE"
        ? "active"
        : item.status === "DISPOSED"
          ? "inactive"
          : "pending",
    metadata: { serialNumber: item.serialNumber },
  });

  /** Nhóm thiết bị theo category: [{ categoryId, categoryName, items }], thứ tự theo danh sách category từ API. */
  const devicesByCategory = useMemo(() => {
    const map = new Map<string, AssetItemFromApi[]>();
    for (const item of rawItems) {
      const list = map.get(item.categoryId) ?? [];
      list.push(item);
      map.set(item.categoryId, list);
    }
    const result: { categoryId: string; categoryName: string; items: AssetItemFromApi[] }[] = [];
    // Thứ tự theo categories từ API
    for (const cat of categories) {
      const items = map.get(cat.id);
      if (items?.length) {
        result.push({ categoryId: cat.id, categoryName: cat.name, items });
        map.delete(cat.id);
      }
    }
    // Phần còn lại (categoryId không có trong danh sách category) gom vào "Khác"
    for (const [categoryId, items] of map) {
      result.push({
        categoryId,
        categoryName: t("staff_building_detail.category_other"),
        items,
      });
    }
    return result;
  }, [rawItems, categories, t]);

  const devices: Device[] = useMemo(
    () => rawItems.map(itemToDevice),
    [rawItems, buildingName]
  );
  const loading = isLoading;

  /** Category đang chọn: null = Tất cả, còn lại = chỉ hiển thị category đó. */
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  /** Chỉ lấy các block category cần hiển thị theo filter. */
  const filteredDevicesByCategory = useMemo(() => {
    if (selectedCategoryId === null) return devicesByCategory;
    return devicesByCategory.filter((g) => g.categoryId === selectedCategoryId);
  }, [devicesByCategory, selectedCategoryId]);

  /** Mở màn Chi tiết thiết bị (cùng root stack với BuildingDetail). */
  const openDeviceDetail = (item: AssetItemFromApi) => {
    const device = itemToDevice(item);
    navigation.navigate("DeviceDetail", { device });
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "#D1FAE5", color: "#059669" };
      case "maintenance":
        return { bg: "#FEF3C7", color: "#D97706" };
      case "inactive":
        return { bg: "#FEE2E2", color: "#DC2626" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return t("staff_building_detail.status_active");
      case "maintenance":
        return t("staff_building_detail.status_maintenance");
      case "inactive":
        return t("staff_building_detail.status_inactive");
      default:
        return t("staff_building_detail.status_pending");
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "electric":
        return t("device_detail.type_label.electric");
      case "water":
        return t("device_detail.type_label.water");
      default:
        return t("device_detail.type_label.other");
    }
  };

  /** Dịch trạng thái căn nhà từ API (AVAILABLE, RENTED, ...). */
  const getHouseStatusLabel = (statusValue: string) => {
    const key =
      statusValue === "AVAILABLE"
        ? "house_status_available"
        : statusValue === "RENTED"
          ? "house_status_rented"
          : "house_status_other";
    return t(`staff_building_detail.${key}`, { status: statusValue });
  };

  const handleAssignNfc = (device: Device) => {
    // TODO: Mở luồng quét NFC / màn gán NFC khi có API
    // Có thể navigate sang Camera (chế độ NFC) hoặc màn AssignNfcScreen
    navigation.navigate("Camera");
  };

  if (loading) {
    return (
      <View style={[staffBuildingDetailStyles.container, staffBuildingDetailStyles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 10, color: "#6B7280" }}>{t("home.loading_data")}</Text>
      </View>
    );
  }

  return (
    <View style={staffBuildingDetailStyles.container}>
      <View style={[staffBuildingDetailStyles.topBar, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={staffBuildingDetailStyles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icons.chevronBack size={28} color="#374151" />
        </TouchableOpacity>
        <Text style={staffBuildingDetailStyles.topBarTitle} numberOfLines={1}>
          {buildingName}
        </Text>
      </View>
      <ScrollView
        contentContainerStyle={staffBuildingDetailStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={staffBuildingDetailStyles.headerCard}>
          <Text style={staffBuildingDetailStyles.buildingName}>{buildingName}</Text>
          <Text style={staffBuildingDetailStyles.buildingAddress}>{buildingAddress}</Text>
          {(ward || commune || city) ? (
            <Text style={staffBuildingDetailStyles.buildingAddressDetail}>
              {[ward, commune, city].filter(Boolean).join(", ")}
            </Text>
          ) : null}
          {status ? (
            <View style={staffBuildingDetailStyles.statusHouseBadge}>
              <Text style={staffBuildingDetailStyles.statusHouseText}>
                {getHouseStatusLabel(status)}
              </Text>
            </View>
          ) : null}
          {description ? (
            <Text style={staffBuildingDetailStyles.buildingDescription}>{description}</Text>
          ) : null}
        </View>

        <Text style={staffBuildingDetailStyles.sectionTitle}>
          {t("staff_building_detail.devices_title", { count: devices.length })}
        </Text>

        {/* Thanh category cuộn ngang (giống StaffHomeScreen) */}
        {devices.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={staffBuildingDetailStyles.categoryContent}
            style={staffBuildingDetailStyles.categoryScroll}
          >
            <TouchableOpacity
              style={[
                staffBuildingDetailStyles.categoryChip,
                selectedCategoryId === null && staffBuildingDetailStyles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategoryId(null)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  staffBuildingDetailStyles.categoryChipText,
                  selectedCategoryId === null && staffBuildingDetailStyles.categoryChipTextActive,
                ]}
              >
                {t("staff_home.all_devices_category_all")}
              </Text>
            </TouchableOpacity>
            {devicesByCategory.map(({ categoryId, categoryName }) => {
              const isActive = selectedCategoryId === categoryId;
              return (
                <TouchableOpacity
                  key={categoryId}
                  style={[
                    staffBuildingDetailStyles.categoryChip,
                    isActive && staffBuildingDetailStyles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategoryId(categoryId)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      staffBuildingDetailStyles.categoryChipText,
                      isActive && staffBuildingDetailStyles.categoryChipTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {categoryName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {devices.length === 0 && !loading ? (
          <View style={staffBuildingDetailStyles.emptyDevices}>
            <Text style={staffBuildingDetailStyles.emptyDevicesText}>
              {isError
                ? t("staff_building_detail.devices_load_error")
                : t("staff_building_detail.no_devices")}
            </Text>
          </View>
        ) : (
          filteredDevicesByCategory.map(({ categoryId, categoryName, items }) => (
            <View key={categoryId} style={staffBuildingDetailStyles.categoryBlock}>
              <Text style={staffBuildingDetailStyles.categorySectionTitle}>
                {categoryName}
              </Text>
              {items.map((item) => {
                const device = itemToDevice(item);
                const hasNfc = !!device.nfcTagId?.trim();
                const statusStyle = getStatusStyle(device.status);
                const meta = device.metadata;
                const metaStr = [
                  meta?.manufacturer,
                  meta?.model,
                  meta?.serialNumber,
                ]
                  .filter(Boolean)
                  .join(" • ");

                return (
                  <TouchableOpacity
                    key={device.id}
                    style={staffBuildingDetailStyles.deviceCard}
                    onPress={() => openDeviceDetail(item)}
                    activeOpacity={0.8}
                  >
                    <View style={staffBuildingDetailStyles.deviceInfo}>
                      <Text style={staffBuildingDetailStyles.deviceName} numberOfLines={1}>
                        {device.name}
                      </Text>
                      <Text style={staffBuildingDetailStyles.deviceLocation}>
                        {device.location}
                      </Text>
                      {metaStr ? (
                        <Text style={staffBuildingDetailStyles.deviceMeta} numberOfLines={1}>
                          {metaStr}
                        </Text>
                      ) : null}
                      <View
                        style={[
                          staffBuildingDetailStyles.nfcBadge,
                          !hasNfc && staffBuildingDetailStyles.nfcBadgeEmpty,
                        ]}
                      >
                        <Text
                          style={[
                            staffBuildingDetailStyles.nfcBadgeText,
                            !hasNfc && staffBuildingDetailStyles.nfcBadgeEmptyText,
                          ]}
                        >
                          {hasNfc
                            ? t("staff_home.nfc_assigned")
                            : t("staff_home.nfc_not_assigned")}
                        </Text>
                      </View>
                      <View
                        style={[
                          staffBuildingDetailStyles.statusBadge,
                          { backgroundColor: statusStyle.bg },
                        ]}
                      >
                        <Text
                          style={[
                            staffBuildingDetailStyles.statusText,
                            { color: statusStyle.color },
                          ]}
                        >
                          {getStatusLabel(device.status)} • {getTypeLabel(device.type)}
                        </Text>
                      </View>
                    </View>
                    {!hasNfc && (
                      <TouchableOpacity
                        style={staffBuildingDetailStyles.assignNfcBtn}
                        onPress={() => handleAssignNfc(device)}
                        activeOpacity={0.8}
                      >
                        <Text style={staffBuildingDetailStyles.assignNfcBtnText}>
                          {t("staff_building_detail.assign_nfc")}
                        </Text>
                      </TouchableOpacity>
                    )}
                    <View style={staffBuildingDetailStyles.deviceCardChevron}>
                      <Icons.chevronForward size={20} color="#64748b" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
