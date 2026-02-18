/**
 * Màn hình Chi tiết nhà dành cho Staff.
 * Hiển thị thông tin nhà + danh sách thiết bị (từ getHouseDevices).
 * Thiết bị chưa có NFC hiển thị nút "Gán mã NFC" (sau này mở luồng quét NFC).
 */
import React, { useEffect, useState } from "react";
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
import { RootStackParamList } from "../../../shared/types";
import { Device } from "../../../shared/types";
import { getHouseDevices } from "../../../shared/services/deviceData";
import Icons from "../../../shared/theme/icon";
import { staffBuildingDetailStyles } from "../styles/staffBuildingDetailStyles";

type BuildingDetailRouteProp = RouteProp<RootStackParamList, "BuildingDetail">;
type NavProp = NativeStackNavigationProp<RootStackParamList, "BuildingDetail">;

export default function BuildingDetailScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<BuildingDetailRouteProp>();
  const insets = useSafeAreaInsets();
  const { buildingId, buildingName, buildingAddress } = route.params;

  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getHouseDevices(buildingId).then((list) => {
      if (!cancelled) {
        setDevices(list);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [buildingId]);

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
        </View>

        <Text style={staffBuildingDetailStyles.sectionTitle}>
          {t("staff_building_detail.devices_title", { count: devices.length })}
        </Text>

        {devices.length === 0 ? (
          <View style={staffBuildingDetailStyles.emptyDevices}>
            <Text style={staffBuildingDetailStyles.emptyDevicesText}>
              {t("staff_building_detail.no_devices")}
            </Text>
          </View>
        ) : (
          devices.map((device) => {
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
              <View key={device.id} style={staffBuildingDetailStyles.deviceCard}>
                <View style={staffBuildingDetailStyles.deviceInfo}>
                  <Text style={staffBuildingDetailStyles.deviceName}>{device.name}</Text>
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
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
