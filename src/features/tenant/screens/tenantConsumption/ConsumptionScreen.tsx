import React, { useState, useRef } from "react";
import { View, Text, Pressable, Animated, useWindowDimensions, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icons from "../../../../shared/theme/icon";
import { RootStackParamList } from "../../../../shared/types";
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
import { brandPrimary, waterAccent, neutral } from "../../../../shared/theme/color";
import { tenantSoftCard } from "../../../../shared/styles/tenantSoftCard";
import ElectricUsageScreen from "./ElectricUsageScreen";
import WaterUsageScreen from "./WaterUsageScreen";

type ConsumptionRouteProp = RouteProp<RootStackParamList, "ConsumptionScreen">;

const ConsumptionScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<ConsumptionRouteProp>();
  const { width: screenWidth } = useWindowDimensions();
  const initialTab = route.params?.initialTab ?? "electric";
  const [activeTab, setActiveTab] = useState<"electric" | "water">(initialTab);
  const slideAnim = useRef(new Animated.Value(initialTab === "electric" ? 0 : 1)).current;

  /**
   * Theo dõi tab nào đã từng được mở ít nhất 1 lần.
   * Chỉ mount component khi tab được visit lần đầu, sau đó ẩn bằng display:none
   * thay vì unmount — tránh request IoT bị bắn lại mỗi lần switch tab.
   */
  const [mountedTabs, setMountedTabs] = useState<{ electric: boolean; water: boolean }>({
    electric: initialTab === "electric",
    water: initialTab === "water",
  });

  const switchTab = (tab: "electric" | "water") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setMountedTabs((prev) => ({ ...prev, [tab]: true }));
    Animated.spring(slideAnim, {
      toValue: tab === "electric" ? 0 : 1,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -screenWidth],
  });

  const accentColor = activeTab === "electric" ? brandPrimary : waterAccent;

  const goHome = () => {
    const parent = navigation.getParent?.();
    if (parent && typeof parent.navigate === "function") {
      parent.navigate("Main" as never);
      return;
    }
    try {
      navigation.navigate("Main" as never);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={styles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <Pressable
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
            >
              <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
            </Pressable>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <Pressable onPress={goHome}>
              <StackScreenTitleBadge numberOfLines={1}>
                {t("consumption.consumption_title") || "Tiêu thụ"}
              </StackScreenTitleBadge>
            </Pressable>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      {/* Switch toggle */}
      <View style={styles.switchContainer}>
        <View style={styles.switchTrack}>
          <Animated.View
            style={[
              styles.switchIndicator,
              {
                width: "50%",
                transform: [
                  {
                    translateX: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (screenWidth - 32) / 2],
                    }),
                  },
                ],
                backgroundColor: accentColor,
              },
            ]}
          />
          <Pressable
            style={styles.switchTab}
            onPress={() => switchTab("electric")}
          >
            <Icons.electric
              color={activeTab === "electric" ? neutral.surface : neutral.textSecondary}
              size={18}
            />
            <Text
              style={[
                styles.switchTabText,
                activeTab === "electric" && styles.switchTabTextActive,
              ]}
            >
              {t("consumption.tab_electric") || "Điện"}
            </Text>
          </Pressable>
          <Pressable
            style={styles.switchTab}
            onPress={() => switchTab("water")}
          >
            <Icons.water
              color={activeTab === "water" ? neutral.surface : neutral.textSecondary}
              size={18}
            />
            <Text
              style={[
                styles.switchTabText,
                activeTab === "water" && styles.switchTabTextActive,
              ]}
            >
              {t("consumption.tab_water") || "Nước"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content area — lazy mount: mỗi tab chỉ mount lần đầu khi được truy cập.
          Cả hai view phải luôn giữ width trong layout để translateX slide đúng vị trí.
          Không dùng display:"none" vì sẽ làm mất không gian layout khiến tab off-screen
          bị translate ra ngoài màn hình thay vì nằm ở cột bên cạnh. */}
      <View style={styles.contentClip}>
        <Animated.View
          style={[
            styles.contentRow,
            { width: screenWidth * 2, transform: [{ translateX }] },
          ]}
        >
          <View style={{ width: screenWidth, flex: 1 }}>
            {mountedTabs.electric && <ElectricUsageScreen showHeader={false} />}
          </View>
          <View style={{ width: screenWidth, flex: 1 }}>
            {mountedTabs.water && <WaterUsageScreen showHeader={false} />}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

export default ConsumptionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  switchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: neutral.canvasMuted,
  },
  switchTrack: {
    flexDirection: "row",
    ...tenantSoftCard,
    borderRadius: 999,
    padding: 3,
    position: "relative",
    overflow: "hidden",
  },
  switchIndicator: {
    position: "absolute",
    top: 3,
    left: 3,
    bottom: 3,
    borderRadius: 22,
  },
  switchTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    zIndex: 1,
  },
  switchTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: neutral.textSecondary,
  },
  switchTabTextActive: {
    color: neutral.surface,
  },
  contentClip: {
    flex: 1,
    overflow: "hidden",
  },
  contentRow: {
    flexDirection: "row",
    flex: 1,
  },
});
