import React, { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { useTranslation } from "react-i18next";
import { useColors } from "../../design/ThemeProvider";
import type { DomainKey } from "../../design/palette";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useDisplayPreferences } from "../../hooks/usePreferences";
import { Text } from "../ui/Text";

export type LiveBadgeProps = {
  active: boolean;
  domain?: DomainKey;
  labelOnline?: string;
  labelOffline?: string;
  style?: ViewStyle;
};

export function LiveBadge({
  active,
  domain,
  labelOnline,
  labelOffline,
  style,
}: LiveBadgeProps) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const display = useDisplayPreferences();
  const { t } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!active || reduced) {
      pulseAnim.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, reduced, pulseAnim]);

  if (!display.showLiveBadge) return null;

  const palette = (() => {
    if (active) {
      return domain
        ? {
            dot: colors.domain[domain].primary,
            bg: colors.domain[domain].primarySoft,
            fg: colors.domain[domain].primary,
            border: colors.domain[domain].border,
          }
        : {
            dot: colors.status.success.solid,
            bg: colors.status.success.bg,
            fg: colors.status.success.fg,
            border: colors.status.success.border,
          };
    }
    return {
      dot: colors.text.muted,
      bg: colors.bg.surfaceMuted,
      fg: colors.text.muted,
      border: colors.border.subtle,
    };
  })();

  const onlineText = labelOnline ?? t("iot.live", { defaultValue: "LIVE" });
  const offlineText = labelOffline ?? t("iot.offline", { defaultValue: "OFFLINE" });

  return (
    <View
      accessibilityLabel={active ? onlineText : offlineText}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          alignSelf: "flex-start",
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: 1,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 3,
        },
        style,
      ]}
    >
      <View style={{ width: 8, height: 8, justifyContent: "center", alignItems: "center" }}>
        {active && !reduced ? (
          <Animated.View
            style={{
              position: "absolute",
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: palette.dot,
              opacity: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.45, 0],
              }),
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.6, 1.6],
                  }),
                },
              ],
            }}
          />
        ) : null}
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: palette.dot,
          }}
        />
      </View>
      <Text variant="overline" weight="700" customColor={palette.fg}>
        {active ? onlineText : offlineText}
      </Text>
    </View>
  );
}
