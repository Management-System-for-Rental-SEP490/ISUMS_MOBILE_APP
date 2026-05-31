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

  const switchTab = (tab: "electric" | "water") => {
    if (tab === activeTab) return;
    setActiveTab(tab);
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

      <Pressable
        onPress={() => navigation.navigate("SmartHomeScreen", { initialTab: activeTab })}
        style={({ pressed }) => [styles.v2Banner, { opacity: pressed ? 0.85 : 1 }]}
        accessibilityRole="button"
      >
        <View style={styles.v2BannerInner}>
          <Text style={styles.v2BannerEmoji}>✨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.v2BannerTitle}>
              {t("smart.try_v2", { defaultValue: "Xem chi tiết hơn" })}
            </Text>
            <Text style={styles.v2BannerSub}>
              {t("smart.try_v2_sub", {
                defaultValue: "Chỉ số real-time, dự đoán & ước tính chi phí, chất lượng không khí",
              })}
            </Text>
          </View>
          <Icons.chevronForward size={18} color={brandPrimary} />
        </View>
      </Pressable>

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

      {/* Content area */}
      <Animated.View
        style={[
          styles.contentRow,
          { width: screenWidth * 2, transform: [{ translateX }] },
        ]}
      >
        <View style={{ width: screenWidth, flex: 1 }}>
          <ElectricUsageScreen showHeader={false} />
        </View>
        <View style={{ width: screenWidth, flex: 1 }}>
          <WaterUsageScreen showHeader={false} />
        </View>
      </Animated.View>
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
  contentRow: {
    flexDirection: "row",
    flex: 1,
  },
  v2Banner: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    backgroundColor: "rgba(59, 181, 130, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(59, 181, 130, 0.25)",
    overflow: "hidden",
  },
  v2BannerInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  v2BannerEmoji: {
    fontSize: 22,
  },
  v2BannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: brandPrimary,
  },
  v2BannerSub: {
    fontSize: 11,
    color: neutral.textSecondary,
    marginTop: 2,
  },
});
