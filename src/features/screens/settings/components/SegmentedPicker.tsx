import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useColors, useTypography } from "../../../../shared/design";
import { useHaptic } from "../../../../shared/hooks/useHaptic";

export type SegmentOption<T extends string | number> = {
  value: T;
  label: string;
  icon?: React.ReactNode;
};

type Props<T extends string | number> = {
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (next: T) => void;
  accessibilityLabel?: string;
  size?: "sm" | "md";
};

export function SegmentedPicker<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
  size = "md",
}: Props<T>) {
  const colors = useColors();
  const typography = useTypography();
  const haptic = useHaptic();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.wrap,
        {
          backgroundColor: colors.bg.surfaceMuted,
          borderColor: colors.border.subtle,
          padding: size === "sm" ? 3 : 4,
        },
      ]}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (active) return;
              haptic("selection");
              onChange(option.value);
            }}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: active
                  ? colors.bg.surface
                  : pressed
                    ? colors.bg.surfaceMuted
                    : "transparent",
                shadowColor: active ? "#000" : "transparent",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: active ? 0.08 : 0,
                shadowRadius: 3,
                elevation: active ? 2 : 0,
                paddingVertical: size === "sm" ? 6 : 8,
              },
            ]}
          >
            {option.icon ? <View style={styles.icon}>{option.icon}</View> : null}
            <Text
              style={[
                size === "sm" ? typography.bodySm : typography.label,
                {
                  color: active
                    ? colors.text.primary
                    : colors.text.secondary,
                  fontWeight: active ? "600" : "500",
                },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  pill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 9,
    paddingHorizontal: 8,
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
});
