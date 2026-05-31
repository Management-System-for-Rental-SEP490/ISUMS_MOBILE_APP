import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors, useTypography } from "../../../../shared/design";

type Props = {
  title: string;
  children: React.ReactNode;
  description?: string;
};

export function SettingSection({ title, description, children }: Props) {
  const colors = useColors();
  const typography = useTypography();

  return (
    <View style={styles.wrapper}>
      <Text
        style={[
          styles.title,
          typography.overline,
          { color: colors.text.secondary },
        ]}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {description ? (
        <Text
          style={[
            styles.description,
            typography.bodySm,
            { color: colors.text.muted },
          ]}
        >
          {description}
        </Text>
      ) : null}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bg.surface,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 24,
  },
  title: {
    marginBottom: 6,
    marginLeft: 4,
  },
  description: {
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
});
