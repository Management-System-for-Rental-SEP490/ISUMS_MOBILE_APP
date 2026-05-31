import React, { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
import { useColors } from "../../design/ThemeProvider";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { intensityColor } from "./intensity";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type RadialProgressProps = {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  intensity?: boolean;
  startAngle?: number;
  endAngle?: number;
  duration?: number;
  children?: React.ReactNode;
  style?: ViewStyle;
  gradientId?: string;
  gradientFrom?: string;
  gradientTo?: string;
};

export function RadialProgress({
  value,
  max = 100,
  size = 220,
  strokeWidth = 14,
  trackColor,
  progressColor,
  intensity = true,
  duration = 800,
  children,
  style,
  gradientId,
  gradientFrom,
  gradientTo,
}: RadialProgressProps) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const ratio = Math.max(0, Math.min(1, max > 0 ? value / max : 0));

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const stroke =
    progressColor ?? (intensity ? intensityColor(colors, ratio) : colors.brand.primary);
  const track = trackColor ?? colors.bg.surfaceMuted;

  const animatedValue = useRef(new Animated.Value(reduced ? ratio : 0)).current;

  useEffect(() => {
    if (reduced) {
      animatedValue.setValue(ratio);
      return;
    }
    Animated.timing(animatedValue, {
      toValue: ratio,
      duration,
      useNativeDriver: false,
    }).start();
  }, [ratio, reduced, duration, animatedValue]);

  const dashOffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const useGradient = gradientId && gradientFrom && gradientTo;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <Svg
        width={size}
        height={size}
        style={{
          position: "absolute",
          transform: [{ rotate: "-90deg" }],
        }}
      >
        {useGradient ? (
          <Defs>
            <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={gradientFrom} />
              <Stop offset="100%" stopColor={gradientTo} />
            </LinearGradient>
          </Defs>
        ) : null}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={useGradient ? `url(#${gradientId})` : stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
        />
      </Svg>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {children}
      </View>
    </View>
  );
}
