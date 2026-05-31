import { useTheme } from "../design/ThemeProvider";

export function useReducedMotion(): boolean {
  return useTheme().reduceMotion;
}

export function motionDuration(
  reduced: boolean,
  full: number,
  reducedValue: number = 0,
): number {
  return reduced ? reducedValue : full;
}
