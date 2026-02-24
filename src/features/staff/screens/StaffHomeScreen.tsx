/**
 * Màn hình Home dành cho Staff (technical).
 * (1) Tóm tắt lịch có việc. (2) Danh sách nhà từ API GET /api/houses; nhấn vào nhà → màn Chi tiết nhà (thiết bị + nút gán NFC).
 */
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainTabParamList } from "../../../shared/types";
import { RootStackParamList } from "../../../shared/types";
import type { Device } from "../../../shared/types";
import type {
  HouseFromApi,
  AssetCategoryFromApi,
  AssetItemFromApi,
} from "../../../shared/types/api";
import Header from "../../../shared/components/header";
import { getWorkScheduleThisWeek, WorkSlot } from "../data/mockStaffData";
import { useStaffSchedule } from "../context/StaffScheduleContext";
import { useHouses, useAssetCategories, useAssetItems } from "../../../shared/hooks";
import Icons from "../../../shared/theme/icon";
import { staffHomeStyles } from "../styles/staffHomeStyles";

type StaffHomeNavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, "Dashboard">,
  NativeStackNavigationProp<RootStackParamList>
>;

const DAY_LABELS: Record<number, string> = {
  1: "T2",
  2: "T3",
  3: "T4",
  4: "T5",
  5: "T6",
  6: "T7",
  7: "CN",
};

export default function StaffHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<StaffHomeNavProp>();
  const { dayOffList } = useStaffSchedule();

  // React Query: gọi API GET /api/houses qua custom hook dùng chung.
  const { data, isLoading, isError, refetch } = useHouses();
  const buildings: HouseFromApi[] = data?.data ?? [];
  const loading = isLoading;

  // Danh mục thiết bị cho thanh filter "Tất cả thiết bị".
  const { data: categoriesData } = useAssetCategories();
  const categories: AssetCategoryFromApi[] = categoriesData?.data ?? [];
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  /** Menu "+" hiện 2 lựa chọn: Tạo danh mục / Tạo thiết bị */
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  // Danh sách thiết bị từ GET /api/asset/items, filter theo category.
  const { data: itemsData } = useAssetItems({ categoryId: selectedCategoryId });
  const items: AssetItemFromApi[] = itemsData?.data ?? [];

  // Chỉ hiển thị các slot có việc (có ticketId) - tóm tắt lịch có việc
  const sortedSchedule = useMemo(
    () =>
      getWorkScheduleThisWeek(dayOffList)
        .filter((slot) => slot.ticketId && slot.ticketId.trim() !== "")
        .sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek || a.timeRange.localeCompare(b.timeRange)
        ),
    [dayOffList]
  );

  const renderScheduleRow = (item: WorkSlot, isLast: boolean) => (
    <View
      key={item.id}
      style={[staffHomeStyles.scheduleRow, isLast && staffHomeStyles.scheduleRowLast]}
    >
      <Text style={staffHomeStyles.scheduleCellTime}>
        {DAY_LABELS[item.dayOfWeek] || ""} {item.date} • {item.timeRange}
      </Text>
      <Text style={staffHomeStyles.scheduleCellBuilding} numberOfLines={1}>
        {item.buildingName}
      </Text>
      <Text style={staffHomeStyles.scheduleCellTask} numberOfLines={2}>
        {item.task}
      </Text>
    </View>
  );

  const openBuildingDetail = (house: HouseFromApi) => {
    const root = navigation.getParent?.();
    if (root && "navigate" in root) {
      (root as { navigate: (name: string, params: object) => void }).navigate(
        "BuildingDetail",
        {
          buildingId: house.id,
          buildingName: house.name,
          buildingAddress: house.address,
          description: house.description,
          ward: house.ward,
          commune: house.commune,
          city: house.city,
          status: house.status,
        }
      );
    }
  };

  /** Dịch trạng thái thiết bị từ API (AVAILABLE, DISPOSED, ...). */
  const getItemStatusLabel = (statusValue: string) => {
    if (statusValue === "AVAILABLE") return t("staff_home.all_devices_status_available");
    if (statusValue === "DISPOSED") return t("staff_home.all_devices_status_disposed");
    return t("staff_home.all_devices_status_other", { status: statusValue });
  };

  const getItemStatusStyle = (statusValue: string) => {
    if (statusValue === "AVAILABLE")
      return { bg: "#D1FAE5", color: "#059669" };
    if (statusValue === "DISPOSED")
      return { bg: "#FEE2E2", color: "#DC2626" };
    return { bg: "#F3F4F6", color: "#6B7280" };
  };

  /** Chuyển AssetItemFromApi (API items) sang Device để màn DeviceDetail dùng chung. */
  const assetItemToDevice = (
    item: AssetItemFromApi,
    houseName?: string
  ): Device => ({
    id: item.id,
    name: item.displayName,
    type: "other",
    nfcTagId: item.nfcId ?? "",
    location: houseName ?? "-",
    status:
      item.status === "AVAILABLE"
        ? "active"
        : item.status === "DISPOSED"
          ? "inactive"
          : "pending",
    metadata: { serialNumber: item.serialNumber },
  });

  /** Mở màn danh sách danh mục (CategoryList), đóng menu. */
  const openCreateCategory = () => {
    setAddMenuVisible(false);
    const root = navigation.getParent?.();
    if (root && "navigate" in root) {
      (root as { navigate: (name: string) => void }).navigate("CategoryList");
    }
  };

  /** Tạo thiết bị: chưa implement, chỉ đóng menu (có thể bổ sung sau). */
  const openCreateDevice = () => {
    setAddMenuVisible(false);
    // TODO: navigate đến màn tạo thiết bị khi có màn hình
  };

  const openDeviceDetail = (item: AssetItemFromApi) => {
    const houseName = buildings.find((b) => b.id === item.houseId)?.name;
    const device = assetItemToDevice(item, houseName);
    const root = navigation.getParent?.();
    if (root && "navigate" in root) {
      (root as { navigate: (name: string, params: object) => void }).navigate(
        "DeviceDetail",
        { device }
      );
    }
  };

  const renderBuildingItem = ({ item }: { item: HouseFromApi }) => (
    <TouchableOpacity
      style={staffHomeStyles.buildingCard}
      onPress={() => openBuildingDetail(item)}
      activeOpacity={0.8}
    >
      <View style={staffHomeStyles.buildingHeader}>
        <Text style={staffHomeStyles.buildingName}>{item.name}</Text>
        <Text style={staffHomeStyles.buildingAddress}>{item.address}</Text>
        <View style={{ position: "absolute", right: 12, top: 14 }}>
          <Icons.chevronForward size={20} color="#64748b" />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Footer: mục "Tất cả thiết bị" với thanh category (từ API) + danh sách items từ GET /api/asset/items
  const listFooter = (
    <View style={staffHomeStyles.devicesSection}>
      <View style={staffHomeStyles.sectionTitleRow}>
        <Text style={staffHomeStyles.sectionTitleLeft}>
          {t("staff_home.all_devices_title")}
        </Text>
        <TouchableOpacity
          style={staffHomeStyles.addButton}
          onPress={() => setAddMenuVisible(true)}
          activeOpacity={0.8}
          accessibilityLabel={t("staff_home.add_menu_open")}
        >
          <Icons.plus size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <Modal
        visible={addMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMenuVisible(false)}
      >
        <Pressable
          style={staffHomeStyles.addMenuOverlay}
          onPress={() => setAddMenuVisible(false)}
        >
          <Pressable style={staffHomeStyles.addMenuBox} onPress={(e) => e.stopPropagation()}>
            <TouchableOpacity
              style={[staffHomeStyles.addMenuItem, staffHomeStyles.addMenuItemBorder]}
              onPress={openCreateCategory}
              activeOpacity={0.7}
            >
              <Text style={staffHomeStyles.addMenuItemText}>
                {t("staff_home.add_menu_create_category")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={staffHomeStyles.addMenuItem}
              onPress={openCreateDevice}
              activeOpacity={0.7}
            >
              <Text style={staffHomeStyles.addMenuItemText}>
                {t("staff_home.add_menu_create_device")}
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={staffHomeStyles.categoryContent}
        style={staffHomeStyles.categoryScroll}
      >
        <TouchableOpacity
          style={[
            staffHomeStyles.categoryChip,
            selectedCategoryId === null && staffHomeStyles.categoryChipActive,
          ]}
          onPress={() => setSelectedCategoryId(null)}
          activeOpacity={0.8}
        >
          <Text
            style={[
              staffHomeStyles.categoryChipText,
              selectedCategoryId === null && staffHomeStyles.categoryChipTextActive,
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
                staffHomeStyles.categoryChip,
                isActive && staffHomeStyles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  staffHomeStyles.categoryChipText,
                  isActive && staffHomeStyles.categoryChipTextActive,
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={staffHomeStyles.devicesList}>
        {items.length === 0 ? (
          <View style={staffHomeStyles.devicesEmpty}>
            <Text style={staffHomeStyles.devicesEmptyText}>
              {t("staff_home.all_devices_no_items")}
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const categoryName =
              categories.find((c) => c.id === item.categoryId)?.name ?? item.categoryId;
            const houseName =
              buildings.find((b) => b.id === item.houseId)?.name ?? item.houseId;
            const statusStyle = getItemStatusStyle(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={staffHomeStyles.deviceItemCard}
                onPress={() => openDeviceDetail(item)}
                activeOpacity={0.8}
              >
                <View style={staffHomeStyles.deviceItemRow}>
                  <View style={staffHomeStyles.deviceItemContent}>
                    <Text style={staffHomeStyles.deviceItemName} numberOfLines={1}>
                      {item.displayName}
                    </Text>
                    <Text style={staffHomeStyles.deviceItemMeta} numberOfLines={1}>
                      {item.serialNumber}
                      {houseName ? ` • ${houseName}` : ""}
                      {categoryName ? ` • ${categoryName}` : ""}
                    </Text>
                    <Text style={staffHomeStyles.deviceItemMeta}>
                      {t("staff_home.asset_condition_label", { percent: item.conditionPercent })}
                    </Text>
                    <View
                      style={[
                        staffHomeStyles.deviceItemStatus,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[
                          staffHomeStyles.deviceItemStatusText,
                          { color: statusStyle.color },
                        ]}
                      >
                        {getItemStatusLabel(item.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={staffHomeStyles.deviceItemChevron}>
                    <Icons.chevronForward size={20} color="#64748b" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </View>
  );

  // Chỉ hiển thị các slot có việc (tóm tắt); trang Lịch mới hiện chi tiết từng ngày.
  const listHeader = (
    <>
      <Text style={staffHomeStyles.sectionTitle}>
        {t("staff_home.schedule_summary_title")}
      </Text>
      <View style={staffHomeStyles.scheduleCard}>
        <View style={staffHomeStyles.scheduleTableHeader}>
          <Text style={staffHomeStyles.scheduleColTime}>
            {t("staff_home.schedule_col_time")}
          </Text>
          <Text style={staffHomeStyles.scheduleColBuilding}>
            {t("staff_home.schedule_col_building")}
          </Text>
          <Text style={staffHomeStyles.scheduleColTask}>
            {t("staff_home.schedule_col_task")}
          </Text>
        </View>
        {sortedSchedule.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: "#94a3b8" }}>
              {t("staff_home.schedule_no_slots")}
            </Text>
          </View>
        ) : (
          sortedSchedule.map((slot, i) =>
            renderScheduleRow(slot, i === sortedSchedule.length - 1)
          )
        )}
      </View>

      <Text style={staffHomeStyles.sectionTitle}>
        {t("staff_home.buildings_title")}
      </Text>
    </>
  );

  if (loading) {
    return (
      <View style={staffHomeStyles.container}>
        <Header variant="default" />
        <View style={staffHomeStyles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={{ marginTop: 10, color: "#6B7280" }}>
            {t("home.loading_data")}
          </Text>
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={staffHomeStyles.container}>
        <Header variant="default" />
        <View style={[staffHomeStyles.loadingContainer, { padding: 24 }]}>
          <Text style={{ color: "#6B7280", textAlign: "center" }}>
            {t("staff_home.buildings_error")}
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{ marginTop: 12, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: "#2563EB", borderRadius: 8 }}
          >
            <Text style={{ color: "#fff", fontWeight: "600" }}>{t("common.try_again")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={staffHomeStyles.container}>
      <Header variant="default" />
      <FlatList
        data={buildings}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        renderItem={renderBuildingItem}
        contentContainerStyle={staffHomeStyles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
