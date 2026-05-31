import React from "react";
import { Text } from "../ui/Text";
import { useFormatters } from "../../hooks/useFormatters";
import type { TypographyVariant } from "../../design/theme";
import type { TextProps } from "../ui/Text";

export type AnimatedNumberProps = Omit<TextProps, "children"> & {
  value: number;
  decimals?: number;
  duration?: number;
  variant?: TypographyVariant;
  format?: (value: number) => string;
};

export function AnimatedNumber({
  value,
  decimals,
  variant = "metric",
  format,
  duration: _duration,
  ...textProps
}: AnimatedNumberProps) {
  const formatters = useFormatters();
  const safe = Number.isFinite(value) ? value : 0;
  const rendered = format ? format(safe) : formatters.decimal(safe, decimals);

  return (
    <Text variant={variant} {...textProps}>
      {rendered}
    </Text>
  );
}
