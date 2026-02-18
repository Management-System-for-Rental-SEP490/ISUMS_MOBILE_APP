/**
 * Màn hình Home dành cho Staff (Technical).
 * (1) Tóm tắt lịch có việc. (2) Danh sách nhà (từ getStaffBuildings); nhấn vào nhà → màn Chi tiết nhà (thiết bị + nút gán NFC).
 */
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import type { CompositeNavigationProp } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainTabParamList } from "../../../shared/types";
import { RootStackParamList } from "../../../shared/types";
import Header from "../../../shared/components/header";
import { getWorkScheduleThisWeek, WorkSlot } from "../data/mockStaffData";
import { useStaffSchedule } from "../context/StaffScheduleContext";
import { getStaffBuildings } from "../../../shared/services/mockHouseService";
import { RentalHouse } from "../../../shared/types";
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
  const [loading, setLoading] = useState(true);
  const [buildings, setBuildings] = useState<RentalHouse[]>([]);

  useEffect(() => {
    getStaffBuildings().then((list) => {
      setBuildings(list);
      setLoading(false);
    });
  }, []);

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

  const openBuildingDetail = (house: RentalHouse) => {
    const root = navigation.getParent?.();
    if (root && "navigate" in root) {
      (root as { navigate: (name: string, params: object) => void }).navigate(
        "BuildingDetail",
        {
          buildingId: house.id,
          buildingName: house.name,
          buildingAddress: house.address,
        }
      );
    }
  };

  const renderBuildingItem = ({ item }: { item: RentalHouse }) => (
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

  return (
    <View style={staffHomeStyles.container}>
      <Header variant="default" />
      <FlatList
        data={buildings}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={listHeader}
        renderItem={renderBuildingItem}
        contentContainerStyle={staffHomeStyles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
