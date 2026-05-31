import React from "react";
import {
  Pressable as RNPressable,
  type PressableProps as RNPressableProps,
  type ViewStyle,
} from "react-native";
import { useHaptic, type HapticEvent } from "../../hooks/useHaptic";
import { useColors } from "../../design/ThemeProvider";

export type PressableProps = Omit<RNPressableProps, "style"> & {
  haptic?: HapticEvent | false;
  pressedOpacity?: number;
  scaleOnPress?: boolean;
  style?: ViewStyle | ((state: { pressed: boolean }) => ViewStyle);
};

export function Pressable({
  haptic = "selection",
  pressedOpacity = 0.7,
  scaleOnPress,
  onPress,
  android_ripple,
  style,
  children,
  ...rest
}: PressableProps) {
  const trigger = useHaptic();
  const colors = useColors();

  return (
    <RNPressable
      android_ripple={
        android_ripple ?? {
          color: colors.brand.primarySoft,
          borderless: false,
        }
      }
      onPress={(event) => {
        if (haptic) trigger(haptic);
        onPress?.(event);
      }}
      style={({ pressed }) => {
        const dynamic: ViewStyle = {
          opacity: pressed ? pressedOpacity : 1,
          transform: scaleOnPress && pressed ? [{ scale: 0.97 }] : undefined,
        };
        const fromProp =
          typeof style === "function" ? style({ pressed }) : style;
        return [dynamic, fromProp];
      }}
      {...rest}
    >
      {children}
    </RNPressable>
  );
}
