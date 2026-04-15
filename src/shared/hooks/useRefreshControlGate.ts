import { useCallback, useState } from "react";
import { Platform } from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/** Dung sai pixel: coi là đầu danh sách khi offsetY <= giá trị này (subpixel / safe area). */
const AT_TOP_EPSILON = 5;

/**
 * Android: luôn mount `RefreshControl` trên ScrollView/FlatList và truyền
 * `enabled: scrollAtTop || đangRefresh` (spread kết quả hàm này) — **không** gỡ
 * `refreshControl` khi cuộn xuống, vì gỡ mount dễ gây remount scroll, nhảy về đầu / giật.
 * iOS: không cần `enabled` (gesture kéo chỉ ở đầu nội dung).
 */
export function refreshControlAndroidGateProps(scrollAtTop: boolean, refreshing: boolean) {
  if (Platform.OS !== "android") return {};
  return { enabled: scrollAtTop || refreshing } as const;
}

/**
 * Chỉ cho phép pull-to-refresh khi người dùng đang ở đầu nội dung cuộn.
 * Gắn `onScrollForRefreshGate` + `scrollEventThrottle` vào ScrollView/FlatList,
 * kết hợp `refreshControl` luôn mount + `refreshControlAndroidGateProps` (Android).
 *
 * `onRefresh` thường gọi `refetch()` / API qua axios: **tối đa** chờ `DATA_LOAD_TIMEOUT_MS` (trần, không ép chờ đủ 4s).
 */
export function useRefreshControlGate() {
  const [scrollAtTop, setScrollAtTop] = useState(true);

  const onScrollForRefreshGate = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setScrollAtTop((prev) => {
      const next = y <= AT_TOP_EPSILON;
      return prev === next ? prev : next;
    });
  }, []);

  return { scrollAtTop, onScrollForRefreshGate };
}
