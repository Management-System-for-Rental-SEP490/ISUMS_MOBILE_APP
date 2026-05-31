import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors, useTypography } from "../../../../shared/design";
import {
  SegmentedPicker,
  type SegmentOption,
} from "./SegmentedPicker";

type Props<T extends string | number> = {
  title: string;
  description?: string;
  options: ReadonlyArray<SegmentOption<T>>;
  value: T;
  onChange: (next: T) => void;
  showDivider?: boolean;
};

export function SettingPickerRow<T extends string | number>({
  title,
  description,
  options,
  value,
  onChange,
  showDivider,
}: Props<T>) {
  const colors = useColors();
  const typography = useTypography();

  return (
    <View>
      <View style={styles.row}>
        <Text
          style={[typography.titleSm, { color: colors.text.primary }]}
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
        <View style={styles.picker}>
          <SegmentedPicker
            options={options}
            value={value}
            onChange={onChange}
            accessibilityLabel={title}
            size={options.length > 4 ? "sm" : "md"}
          />
        </View>
      </View>
      {showDivider ? (
        <View
          style={[styles.divider, { backgroundColor: colors.border.subtle }]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  picker: {
    marginTop: 12,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
});
