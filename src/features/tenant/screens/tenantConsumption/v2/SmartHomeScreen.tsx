import React, { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../../shared/components/StackScreenTitleBadge";
import Icons from "../../../../../shared/theme/icon";
import type { RootStackParamList } from "../../../../../shared/types";
import { useColors } from "../../../../../shared/design";
import { spacing } from "../../../../../shared/design/tokens";
import { Text } from "../../../../../shared/components/ui";
import { useHaptic } from "../../../../../shared/hooks/useHaptic";
import ElectricUsageScreenV2 from "./ElectricUsageScreenV2";
import WaterUsageScreenV2 from "./WaterUsageScreenV2";

type SmartTab = "electric" | "water";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SWITCH_MS = 180;

export default function SmartHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const haptic = useHaptic();
  const { width } = useWindowDimensions();

  const [tab, setTab] = useState<SmartTab>("electric");
  /**
   * Lazy mount: mỗi tab chỉ mount lần đầu khi được truy cập.
   * Sau đó ẩn bằng opacity+pointerEvents thay vì unmount —
   * tránh re-trigger loading state (isLoading popup) mỗi lần switch.
   */
  const [mountedTabs, setMountedTabs] = useState<Record<SmartTab, boolean>>({
    electric: true,
    water: false,
  });
  /** Animated.Value: 0 = electric, 1 = water */
  const pillAnim = useRef(new Animated.Value(0)).current;
  /** Chiều rộng 1 tab (đo sau layout) để tính vị trí pill */
  const [singleTabW, setSingleTabW] = useState(0);

  const switchTab = (newTab: SmartTab) => {
    if (newTab === tab) return;
    haptic("selection");
    setTab(newTab);
    setMountedTabs((prev) => ({ ...prev, [newTab]: true }));
    Animated.timing(pillAnim, {
      toValue: newTab === "electric" ? 0 : 1,
      duration: SWITCH_MS,
      useNativeDriver: true,
    }).start();
  };

  const tabs: Array<{ key: SmartTab; label: string; icon: React.ReactNode; color: string }> = [
    {
      key: "electric",
      label: t("smart.tab.electric", { defaultValue: "Điện" }),
      icon: <Icons.electric size={18} color={tab === "electric" ? colors.bg.surface : colors.text.muted} />,
      color: colors.domain.electric.primary,
    },
    {
      key: "water",
      label: t("smart.tab.water", { defaultValue: "Nước" }),
      icon: <Icons.water size={18} color={tab === "water" ? colors.bg.surface : colors.text.muted} />,
      color: colors.domain.water.primary,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg.canvas }]}>
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
            <StackScreenTitleBadge numberOfLines={1}>
              {t("smart.title", { defaultValue: "Smart Home" })}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <View style={[styles.tabRow, { backgroundColor: colors.bg.canvas }]}>
        <View
          style={[
            styles.tabTrack,
            {
              backgroundColor: colors.bg.surface,
              borderColor: colors.border.subtle,
            },
          ]}
          onLayout={(e) => {
            // Tính chiều rộng 1 ô tab: (trackWidth - padding*2 - gap) / 2
            const tw = e.nativeEvent.layout.width;
            setSingleTabW((tw - 8 - 4) / 2); // padding: 4 mỗi bên, gap: 4
          }}
        >
          {/* Pill trượt animated — nằm phía sau text/icon */}
          {singleTabW > 0 ? (
            <Animated.View
              style={[
                styles.tabPill,
                {
                  width: singleTabW,
                  backgroundColor: tabs.find((t) => t.key === tab)?.color ?? colors.brand.primary,
                  transform: [
                    {
                      translateX: pillAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, singleTabW + 4], // +4 = gap
                      }),
                    },
                  ],
                },
              ]}
            />
          ) : null}

          {tabs.map((it) => {
            const active = tab === it.key;
            return (
              <Pressable
                key={it.key}
                onPress={() => switchTab(it.key)}
                style={styles.tab}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={it.label}
              >
                {it.icon}
                <Text
                  variant="label"
                  weight={active ? "700" : "500"}
                  customColor={active ? colors.bg.surface : colors.text.secondary}
                >
                  {it.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Lazy mount: mỗi tab mount 1 lần, ẩn bằng opacity+pointerEvents thay vì unmount */}
      <View style={{ flex: 1, width }}>
        <View
          style={[
            styles.tabContent,
            tab !== "electric" && styles.tabContentHidden,
          ]}
          pointerEvents={tab === "electric" ? "auto" : "none"}
        >
          {mountedTabs.electric && <ElectricUsageScreenV2 showHeader={false} />}
        </View>
        <View
          style={[
            styles.tabContent,
            tab !== "water" && styles.tabContentHidden,
          ]}
          pointerEvents={tab === "water" ? "auto" : "none"}
        >
          {mountedTabs.water && <WaterUsageScreenV2 showHeader={false} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabRow: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  tabTrack: {
    flexDirection: "row",
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    gap: 4,
    position: "relative",
  },
  /** Pill trượt animated — nằm absolute phía sau icon/text */
  tabPill: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: 999,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
    zIndex: 1, // nổi lên trên pill
  },
  /** Content tab đang hiển thị */
  tabContent: {
    ...StyleSheet.absoluteFillObject,
  },
  /** Content tab đang ẩn — opacity 0, không nhận touch */
  tabContentHidden: {
    opacity: 0,
  },
});
