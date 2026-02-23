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
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { MainTabParamList } from "../../../shared/types";
import { RootStackParamList } from "../../../shared/types";
import type { HouseFromApi, AssetCategoryFromApi } from "../../../shared/types";
import Header from "../../../shared/components/header";
import { getWorkScheduleThisWeek, WorkSlot } from "../data/mockStaffData";
import { useStaffSchedule } from "../context/StaffScheduleContext";
import { getHouses, getAssetCategories } from "../../../shared/services/houseApi";
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

  // React Query: gọi API GET /api/houses, cache key "houses", token tự gắn qua axiosClient
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["houses"],
    queryFn: getHouses,
  });
  const buildings: HouseFromApi[] = data?.data ?? [];
  const loading = isLoading;

  // Danh mục thiết bị từ API GET /api/asset/categories (dùng cho thanh filter "Tất cả thiết bị")
  const { data: categoriesData } = useQuery({
    queryKey: ["assetCategories"],
    queryFn: getAssetCategories,
  });
  const categories: AssetCategoryFromApi[] = categoriesData?.data ?? [];
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

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

  // Footer: mục "Tất cả thiết bị" với thanh category (từ API) + placeholder cho danh sách items (API thêm sau)
  const listFooter = (
    <View style={staffHomeStyles.devicesSection}>
      <Text style={staffHomeStyles.sectionTitle}>
        {t("staff_home.all_devices_title")}
      </Text>
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
      <View style={staffHomeStyles.devicesPlaceholder}>
        <Text style={staffHomeStyles.devicesPlaceholderText}>
          {t("staff_home.all_devices_items_placeholder")}
        </Text>
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
