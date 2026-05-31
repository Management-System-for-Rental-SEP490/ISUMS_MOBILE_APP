import React, { useEffect, useRef } from "react";
import { Animated, type ViewStyle } from "react-native";
import { useColors } from "../../design/ThemeProvider";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { radius, type RadiusToken } from "../../design/tokens";

export type SkeletonProps = {
  width?: number | "auto" | `${number}%`;
  height?: number | "auto" | `${number}%`;
  rounded?: RadiusToken;
  style?: ViewStyle;
};

export function Skeleton({
  width = "100%",
  height = 16,
  rounded = "md",
  style,
}: SkeletonProps) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: false,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, animValue]);

  const opacity = reduced
    ? 1
    : animValue.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  return (
    <Animated.View
      accessibilityRole="progressbar"
      style={[
        {
          width,
          height,
          borderRadius: radius[rounded],
          backgroundColor: colors.bg.surfaceMuted,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonText({
  lines = 3,
  spacing: gap = 8,
  lastWidth = "60%",
}: {
  lines?: number;
  spacing?: number;
  lastWidth?: `${number}%`;
}) {
  return (
    <>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? lastWidth : "100%"}
          style={{ marginTop: i === 0 ? 0 : gap }}
        />
      ))}
    </>
  );
}
