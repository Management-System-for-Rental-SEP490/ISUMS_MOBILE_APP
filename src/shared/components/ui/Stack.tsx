import React from "react";
import { View, type ViewProps, type ViewStyle } from "react-native";
import { spacing, type SpacingToken } from "../../design/tokens";

type Direction = "row" | "column";

export type StackProps = ViewProps & {
  direction?: Direction;
  gap?: SpacingToken;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  wrap?: boolean;
  flex?: number;
};

function StackBase({
  direction,
  gap = "sm",
  align,
  justify,
  wrap,
  flex,
  style,
  children,
  ...rest
}: StackProps & { direction: Direction }) {
  const computed: ViewStyle = {
    flexDirection: direction,
    gap: spacing[gap],
    alignItems: align,
    justifyContent: justify,
    flexWrap: wrap ? "wrap" : undefined,
    flex,
  };
  return (
    <View {...rest} style={[computed, style]}>
      {children}
    </View>
  );
}

export function VStack(props: StackProps) {
  return <StackBase {...props} direction="column" />;
}

export function HStack(props: StackProps) {
  return <StackBase {...props} direction="row" />;
}

export function Spacer({ size = "sm" }: { size?: SpacingToken }) {
  return <View style={{ height: spacing[size], width: spacing[size] }} />;
}
