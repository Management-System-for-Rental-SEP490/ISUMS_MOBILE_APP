import React, { useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
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

export default function SmartHomeScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const colors = useColors();
  const haptic = useHaptic();
  const { width } = useWindowDimensions();
  const [tab, setTab] = useState<SmartTab>("electric");

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
        >
          {tabs.map((it) => {
            const active = tab === it.key;
            return (
              <Pressable
                key={it.key}
                onPress={() => {
                  if (active) return;
                  haptic("selection");
                  setTab(it.key);
                }}
                style={[
                  styles.tab,
                  active && {
                    backgroundColor: it.color,
                  },
                ]}
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

      <View style={{ flex: 1, width }}>
        {tab === "electric" ? (
          <ElectricUsageScreenV2 showHeader={false} />
        ) : null}
        {tab === "water" ? <WaterUsageScreenV2 showHeader={false} /> : null}
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
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 999,
  },
});
