// src/features/tenant/components/AlertBanner.tsx
// Banner nổi ở đầu màn hình khi có alert mới

import React, { useEffect, useRef, memo } from "react";
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { IAlert } from "../types/alert";
import {
  ALERT_META,
  getAlertColor,
  formatAlertValue,
} from "../utils/alertHelpers";

const { width: SCREEN_W } = Dimensions.get("window");
const AUTO_DISMISS_MS = 5000;

interface AlertBannerProps {
  alert:      IAlert | null;
  onPress?:   (alert: IAlert) => void;
  onDismiss?: () => void;
}

const AlertBanner = memo(function AlertBanner({
  alert,
  onPress,
  onDismiss,
}: AlertBannerProps) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!alert) return;

    // Slide in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue:         0,
        useNativeDriver: true,
        tension:         80,
        friction:        10,
      }),
      Animated.timing(opacity, {
        toValue:         1,
        duration:        250,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => dismiss(), AUTO_DISMISS_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [alert?.alertId]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue:         -120,
        duration:        300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue:         0,
        duration:        250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss?.());
  };

  if (!alert) return null;

  const meta     = ALERT_META[alert.metric];
  const color    = getAlertColor(alert);
  const valueStr = formatAlertValue(alert);

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          onPress?.(alert);
          dismiss();
        }}
        style={[styles.banner, { borderLeftColor: color, borderLeftWidth: 5 }]}
      >
        {/* Left: icon */}
        <Text style={styles.icon}>{meta?.icon ?? "⚠️"}</Text>

        {/* Center: text */}
        <View style={styles.textWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {alert.title}
          </Text>
          {alert.areaName ? (
            <Text style={styles.area} numberOfLines={1}>
              📍 {alert.areaName}
            </Text>
          ) : null}
        </View>

        {/* Right: value + close */}
        <View style={styles.rightWrap}>
          {valueStr ? (
            <Text style={[styles.value, { color }]}>{valueStr}</Text>
          ) : null}
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={dismiss}
          >
            <Text style={styles.close}>✕</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default AlertBanner;

const styles = StyleSheet.create({
  container: {
    position:  "absolute",
    top:       52,
    left:      12,
    right:     12,
    zIndex:    9999,
    elevation: 10,
  },
  banner: {
    flexDirection:   "row",
    alignItems:      "center",
    backgroundColor: "#FFFFFF",
    borderRadius:    14,
    padding:         14,
    gap:             10,
    shadowColor:     "#000",
    shadowOpacity:   0.15,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
  },
  icon: {
    fontSize: 24,
  },
  textWrap: {
    flex: 1,
    gap:  2,
  },
  title: {
    fontSize:   14,
    fontWeight: "700",
    color:      "#1C1C1E",
  },
  area: {
    fontSize: 12,
    color:    "#636366",
  },
  rightWrap: {
    alignItems: "flex-end",
    gap:        4,
  },
  value: {
    fontSize:   14,
    fontWeight: "700",
  },
  close: {
    fontSize: 14,
    color:    "#C7C7CC",
    fontWeight: "600",
  },
});