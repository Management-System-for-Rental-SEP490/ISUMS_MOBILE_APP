import React from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useColors, useTypography } from "../../../../shared/design";
import { useHaptic } from "../../../../shared/hooks/useHaptic";
import Icons from "../../../../shared/theme/icon";

type Variant = "navigation" | "toggle" | "value" | "static";

type Props = {
  title: string;
  description?: string;
  variant?: Variant;
  value?: string;
  toggled?: boolean;
  onToggle?: (next: boolean) => void;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  showDivider?: boolean;
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
  style?: ViewStyle;
};

export function SettingRow({
  title,
  description,
  variant = "value",
  value,
  toggled,
  onToggle,
  onPress,
  destructive,
  disabled,
  showDivider,
  leadingIcon,
  trailing,
  style,
}: Props) {
  const colors = useColors();
  const typography = useTypography();
  const haptic = useHaptic();

  const interactive = variant !== "static" && !disabled;

  const handlePress = () => {
    if (!interactive) return;
    haptic("selection");
    if (variant === "toggle" && onToggle) {
      onToggle(!toggled);
      return;
    }
    onPress?.();
  };

  const handleToggle = (next: boolean) => {
    haptic("selection");
    onToggle?.(next);
  };

  const titleColor = destructive
    ? colors.status.critical.fg
    : disabled
      ? colors.text.disabled
      : colors.text.primary;

  return (
    <View>
      <Pressable
        onPress={handlePress}
        disabled={!interactive}
        accessibilityRole={
          variant === "toggle" ? "switch" : variant === "navigation" ? "button" : undefined
        }
        accessibilityState={{ checked: toggled, disabled }}
        accessibilityLabel={title}
        android_ripple={
          interactive
            ? { color: colors.brand.primarySoft, borderless: false }
            : undefined
        }
        style={({ pressed }) => [
          styles.row,
          {
            backgroundColor:
              pressed && interactive
                ? colors.bg.surfaceMuted
                : colors.bg.surface,
            opacity: disabled ? 0.5 : 1,
          },
          style,
        ]}
      >
        {leadingIcon ? <View style={styles.leading}>{leadingIcon}</View> : null}
        <View style={styles.content}>
          <Text
            style={[
              typography.titleSm,
              { color: titleColor },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {description ? (
            <Text
              style={[
                typography.bodySm,
                { color: colors.text.muted, marginTop: 2 },
              ]}
              numberOfLines={3}
            >
              {description}
            </Text>
          ) : null}
        </View>
        <View style={styles.trailing}>
          {trailing}
          {variant === "toggle" ? (
            <Switch
              value={!!toggled}
              onValueChange={handleToggle}
              disabled={disabled}
              trackColor={{
                false: colors.border.strong,
                true: colors.brand.primary,
              }}
              thumbColor={colors.bg.surface}
              ios_backgroundColor={colors.border.strong}
            />
          ) : null}
          {variant === "value" && value ? (
            <Text
              style={[
                typography.body,
                { color: colors.text.secondary, marginRight: 4 },
              ]}
            >
              {value}
            </Text>
          ) : null}
          {variant === "navigation" || variant === "value" ? (
            <Icons.chevronForward size={18} color={colors.text.muted} />
          ) : null}
        </View>
      </Pressable>
      {showDivider ? (
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.border.subtle },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leading: {
    marginRight: 12,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  trailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
});
