import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Keyboard,
  Animated,
  Easing,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { useTranslation } from "react-i18next";
import Icons from "../theme/icon";
import { brandBlueMutedBorder, brandPrimary, brandTintBg, neutral } from "../theme/color";
import { appTypography } from "../utils";

/** Độ trượt khi mở/đóng panel — nhỏ = mở “Khu vực nhà” nhẹ nhàng, ít giật. */
const PANEL_SLIDE_PX = 6;
const PANEL_OPEN_MS = 300;
/** Đóng: height hơi dài hơn opacity để nội dung “biến” trước khi khung co — tránh nhịp đẩy/lag. */
const PANEL_CLOSE_MS = 240;
const PANEL_CLOSE_OPACITY_MS = 160;

const MIN_TRIGGER_HEIGHT = 48;

export type DropdownBoxItem = {
  id: string;
  label: string;
  /** Dòng phụ (tên danh mục…), dùng khi `itemLayout="list"`. */
  detail?: string;
  /** Hiển thị dòng “Số thiết bị: **n**” (list layout). */
  deviceCount?: number;
};

export type DropdownBoxSection = {
  id: string;
  title: string;
  items: DropdownBoxItem[];
  /** Ghi đè layout cho riêng section này. */
  itemLayout?: "chips" | "list";
  /** `null` khi đang chọn hàng "Tất cả" (nếu có). */
  selectedId: string | null;
  /**
   * `false` = không có hàng "Tất cả" (vd. chỉ chọn tầng cụ thể).
   * Mặc định `true`.
   */
  showAllOption?: boolean;
  allLabel?: string;
};

export type DropdownBoxProps = {
  sections: DropdownBoxSection[];
  /** Một dòng tóm tắt trên nút mở (parent tự format + i18n). */
  summary: string;
  onSelect: (sectionId: string, itemId: string | null) => void;
  style?: StyleProp<ViewStyle>;
  onAfterSelect?: (sectionId: string, itemId: string | null) => void;
  /**
   * Callback khi user nhập text vào ô search trong dropdown.
   * Dùng để parent filter dữ liệu theo cùng query.
   */
  onSearchChange?: (query: string) => void;
  /**
   * Gọi khi ô tìm trong panel được focus (sau khi mở panel).
   * Dùng để `scrollToOffset` / `scrollTo` trên FlatList/ScrollView cha — tránh bàn phím che.
   */
  onSearchInputFocus?: () => void;
  /** `list` = danh sách dọc (tìm + hàng), `chips` = chip cuộn ngang (mặc định). */
  itemLayout?: "chips" | "list";
  /** Viền/trục nhấn cho trigger + panel (vd. picker căn nhà Staff Home). */
  triggerAccent?: boolean;
  /** Tuỳ chỉnh placeholder ô tìm (mặc định `dropdown_box.search_placeholder`). */
  searchPlaceholder?: string;
  /**
   * `false` = mở panel không gọi bàn phím; chỉ khi user chạm ô tìm mới focus (vd. danh sách căn nhà Staff Home).
   * Mặc định `true`.
   */
  searchAutoFocus?: boolean;
  /** Mở sẵn panel ngay khi component mount. Mặc định `false`. */
  defaultExpanded?: boolean;
  /**
   * Mỗi lần giá trị tăng (1, 2, …), tự mở panel (vd. chọn khu vực trên sơ đồ).
   * Giữ `0` khi không cần mở từ bên ngoài.
   */
  expandSignal?: number;
  /** Báo cho màn cha khi đóng/mở panel (vd. xoá padding bàn phím dư). */
  onExpandedChange?: (expanded: boolean) => void;
};

type SectionBlock = {
  sec: DropdownBoxSection;
  allVisible: boolean;
  allLabel: string;
  filteredItems: DropdownBoxItem[];
};

function norm(s: string) {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
}

function itemMatches(item: DropdownBoxItem, q: string) {
  if (!q) return true;
  const n = norm(q);
  return (
    norm(item.label).includes(n) ||
    norm(item.id).includes(n) ||
    norm(item.detail ?? "").includes(n)
  );
}

function itemScore(item: DropdownBoxItem, q: string): number {
  const query = norm(q);
  if (!query) return 0;
  const label = norm(item.label);
  const id = norm(item.id);
  const detail = norm(item.detail ?? "");
  if (label === query) return 140;
  if (label.startsWith(query)) return 120;
  if (label.includes(query)) return 90;
  if (id === query) return 80;
  if (id.startsWith(query)) return 70;
  if (id.includes(query)) return 50;
  if (detail.startsWith(query)) return 40;
  if (detail.includes(query)) return 30;
  return 0;
}

function sortFilteredItems(items: DropdownBoxItem[], q: string): DropdownBoxItem[] {
  if (!q) return items;
  return [...items].sort((a, b) => {
    const scoreDiff = itemScore(b, q) - itemScore(a, q);
    if (scoreDiff !== 0) return scoreDiff;
    return a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  });
}

function buildSectionBlocks(
  sections: DropdownBoxSection[],
  query: string,
  defaultAllLabel: string
): SectionBlock[] {
  const q = norm(query);
  const blocks: SectionBlock[] = [];
  for (const sec of sections) {
    const allLabel = sec.allLabel ?? defaultAllLabel;
    const showAll = sec.showAllOption !== false;
    const allVisible = showAll && (!q || norm(allLabel).includes(q));
    const filteredItems = sortFilteredItems(
      sec.items.filter((it) => itemMatches(it, q)),
      q
    );
    if (!allVisible && filteredItems.length === 0) continue;
    blocks.push({ sec, allVisible, allLabel, filteredItems });
  }
  return blocks;
}

/**
 * Gom nhiều bộ lọc (tầng, danh mục, …): nhấn mở ngay tại chỗ — thanh tìm kiếm + chip theo thứ tự BE.
 */
export function DropdownBox({
  sections,
  summary,
  onSelect,
  style,
  onAfterSelect,
  onSearchChange,
  onSearchInputFocus,
  itemLayout = "chips",
  triggerAccent = false,
  searchPlaceholder,
  searchAutoFocus = true,
  defaultExpanded = false,
  expandSignal = 0,
  onExpandedChange,
}: DropdownBoxProps) {
  const { t } = useTranslation();
  const { height: windowH } = useWindowDimensions();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [search, setSearch] = useState("");
  const prevExpandSignalRef = useRef(0);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(-PANEL_SLIDE_PX)).current;
  const heightAnim = useRef(
    new Animated.Value(defaultExpanded ? MIN_TRIGGER_HEIGHT : 0)
  ).current;
  /** Lần mở đầu nếu defaultExpanded — hiển thị ngay, không animate. */
  const skipEntranceSpringRef = useRef(defaultExpanded);
  /** Chiều cao row “Khu vực nhà” / trigger — dùng làm điểm đầu khi mở & điểm cuối khi đóng. */
  const triggerHeightRef = useRef(MIN_TRIGGER_HEIGHT);
  const openEntranceStartedRef = useRef(false);
  const lastPanelHeightRef = useRef(0);
  /** Chiều cao hàng tìm kiếm — onLayout (không dùng measure() vì bị clip bởi heightAnim). */
  const searchRowHeightRef = useRef(52);
  /** Chiều cao nội dung cuộn dọc (chip + section) từ ScrollView.onContentSizeChange. */
  const scrollBodyContentHRef = useRef(0);
  const wasExpandedRef = useRef(false);
  /** Tránh nhiều `Animated.timing` co giãn panel chồng chéo khi `onContentSizeChange` bắn liên tục. */
  const panelGrowAnimLockRef = useRef(false);
  const onExpandedChangeRef = useRef(onExpandedChange);
  onExpandedChangeRef.current = onExpandedChange;
  const onSearchChangeRef = useRef(onSearchChange);
  onSearchChangeRef.current = onSearchChange;

  /** rAF: tránh parent gọi scroll/setState trong cùng commit với layout panel → hạn chế vòng cập nhật. */
  useEffect(() => {
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (!cancelled) onExpandedChangeRef.current?.(expanded);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    setSearch("");
    onSearchChangeRef.current?.("");
  }, [expanded]);

  useEffect(() => {
    if (expandSignal <= 0) return;
    if (expandSignal === prevExpandSignalRef.current) return;
    prevExpandSignalRef.current = expandSignal;
    if (!expanded) {
      const th = Math.max(triggerHeightRef.current, MIN_TRIGGER_HEIGHT);
      heightAnim.setValue(th);
      openEntranceStartedRef.current = false;
      scrollBodyContentHRef.current = 0;
      setExpanded(true);
    }
  }, [expandSignal, expanded]);

  useEffect(() => {
    if (!expanded) {
      openEntranceStartedRef.current = false;
    }
  }, [expanded]);

  const beginOpenEntrance = useCallback(() => {
    const th = Math.max(triggerHeightRef.current, MIN_TRIGGER_HEIGHT);
    heightAnim.setValue(th);
    openEntranceStartedRef.current = false;
    scrollBodyContentHRef.current = 0;
    setExpanded(true);
  }, [heightAnim]);

  const runOpenEntranceAnimation = useCallback(
    (fullPanelH: number) => {
      if (openEntranceStartedRef.current) return;
      if (fullPanelH <= 0) return;
      panelGrowAnimLockRef.current = false;
      const th = Math.max(triggerHeightRef.current, MIN_TRIGGER_HEIGHT);
      openEntranceStartedRef.current = true;
      lastPanelHeightRef.current = fullPanelH;

      if (skipEntranceSpringRef.current) {
        skipEntranceSpringRef.current = false;
        heightAnim.setValue(fullPanelH);
        opacityAnim.setValue(1);
        translateAnim.setValue(0);
        return;
      }

      heightAnim.setValue(th);
      opacityAnim.setValue(0);
      translateAnim.setValue(-PANEL_SLIDE_PX);

      const easeOut = Easing.out(Easing.cubic);
      Animated.parallel([
        Animated.timing(heightAnim, {
          toValue: fullPanelH,
          duration: PANEL_OPEN_MS,
          easing: easeOut,
          useNativeDriver: false,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: PANEL_OPEN_MS,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: PANEL_OPEN_MS,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]).start();
    },
    [heightAnim, opacityAnim, translateAnim]
  );

  /** Giới hạn cuộn dọc; đồng bộ với style ScrollView. */
  const resultsMaxHeight = Math.min(320, Math.round(windowH * 0.42));

  const requestPanelOpenFromScrollMetrics = useCallback(() => {
    if (!expanded) return;
    if (openEntranceStartedRef.current) return;
    const ch = scrollBodyContentHRef.current;
    const sr = Math.max(searchRowHeightRef.current, 44);
    if (ch <= 0) return;
    const bodyH = Math.min(resultsMaxHeight, ch);
    /** Viền panel + sai số layout; onContentSizeChange là nội dung, thêm phần khung. */
    const panelFramePad = 8;
    const h = sr + bodyH + panelFramePad;
    runOpenEntranceAnimation(h);
  }, [expanded, resultsMaxHeight, runOpenEntranceAnimation]);

  /** Khi nội dung báo cao hơn sau lúc mở (ScrollView bị clip lúc đầu) — kéo panel thêm. */
  const growPanelHeightIfNeeded = useCallback(
    (contentH: number) => {
      if (!expanded) return;
      const ch = Math.ceil(contentH);
      if (ch <= 0) return;
      scrollBodyContentHRef.current = Math.max(scrollBodyContentHRef.current, ch);
      const sr = Math.max(searchRowHeightRef.current, 44);
      const bodyH = Math.min(resultsMaxHeight, scrollBodyContentHRef.current);
      const panelFramePad = 8;
      const h = sr + bodyH + panelFramePad;
      if (!openEntranceStartedRef.current) {
        requestPanelOpenFromScrollMetrics();
        return;
      }
      if (h > lastPanelHeightRef.current + 6) {
        if (panelGrowAnimLockRef.current) return;
        panelGrowAnimLockRef.current = true;
        Animated.timing(heightAnim, {
          toValue: h,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }).start(() => {
          panelGrowAnimLockRef.current = false;
        });
        lastPanelHeightRef.current = h;
      }
    },
    [expanded, heightAnim, requestPanelOpenFromScrollMetrics, resultsMaxHeight]
  );

  /** Mỗi lần chuyển từ đóng → mở: reset metric nội dung, tránh dùng chiều cao lần mở trước. */
  useLayoutEffect(() => {
    if (!expanded) {
      wasExpandedRef.current = false;
      return;
    }
    if (!wasExpandedRef.current) {
      wasExpandedRef.current = true;
      const th = Math.max(triggerHeightRef.current, MIN_TRIGGER_HEIGHT);
      heightAnim.setValue(th);
      openEntranceStartedRef.current = false;
      scrollBodyContentHRef.current = 0;
    }
  }, [expanded]);

  const fadeOutAndClose = useCallback(() => {
    panelGrowAnimLockRef.current = false;
    const th = Math.max(triggerHeightRef.current, MIN_TRIGGER_HEIGHT);
    heightAnim.stopAnimation();
    opacityAnim.stopAnimation();
    translateAnim.stopAnimation();
    /** Không trượt âm khi đóng — tránh hai chuyển động “đẩy lên” (translate + co height). */
    translateAnim.setValue(0);

    const easeHeight = Easing.bezier(0.22, 1, 0.36, 1);
    const easeOpacity = Easing.out(Easing.quad);

    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: th,
        duration: PANEL_CLOSE_MS,
        easing: easeHeight,
        useNativeDriver: false,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: PANEL_CLOSE_OPACITY_MS,
        easing: easeOpacity,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        /** Một frame trước khi đổi trigger — tránh trùng layout với giá trị height vừa dừng. */
        requestAnimationFrame(() => setExpanded(false));
      }
    });
  }, [heightAnim, opacityAnim, translateAnim]);

  const notifyParentScrollForSearch = useCallback(() => {
    if (!onSearchInputFocus) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => onSearchInputFocus());
    });
  }, [onSearchInputFocus]);

  const defaultAllLabel = t("staff_home.all_devices_category_all");
  const sectionBlocks = useMemo(
    () => buildSectionBlocks(sections, search, defaultAllLabel),
    [sections, search, defaultAllLabel]
  );

  const collapse = useCallback(() => {
    Keyboard.dismiss();
    fadeOutAndClose();
  }, [fadeOutAndClose]);

  const handleSelect = useCallback(
    (sectionId: string, itemId: string | null) => {
      Keyboard.dismiss();
      onSelect(sectionId, itemId);
      onAfterSelect?.(sectionId, itemId);
      fadeOutAndClose();
    },
    [onSelect, onAfterSelect, fadeOutAndClose]
  );

  if (sections.length === 0) {
    return null;
  }

  return (
    <View style={style}>
      {!expanded ? (
        <Pressable
          onLayout={(ev) => {
            const h = Math.ceil(ev.nativeEvent.layout.height);
            if (h > 0) triggerHeightRef.current = h;
          }}
          onPress={beginOpenEntrance}
          style={[styles.trigger, triggerAccent && styles.triggerAccent]}
          accessibilityRole="button"
          accessibilityLabel={`${t("dropdown_box.open_a11y")}: ${summary}`}
        >
          <Text style={styles.triggerText} numberOfLines={2}>
            {summary}
          </Text>
          <Icons.chevronDown size={22} color={neutral.textSecondary} />
        </Pressable>
      ) : (
        <Animated.View
          collapsable={false}
          style={[styles.avoidingWrap, { height: heightAnim, overflow: "hidden" }]}
        >
          <Animated.View
            style={{
              opacity: opacityAnim,
              transform: [{ translateY: translateAnim }],
            }}
          >
            <View style={[styles.panel, triggerAccent && styles.panelAccent]}>
            <View
              style={styles.searchRow}
              onLayout={(ev) => {
                const h = Math.ceil(ev.nativeEvent.layout.height);
                if (h > 0) searchRowHeightRef.current = h;
                requestPanelOpenFromScrollMetrics();
              }}
            >
              <Icons.search size={20} color={neutral.iconMuted} />
              <TextInput
                value={search}
                onChangeText={(text) => {
                  setSearch(text);
                  onSearchChange?.(text);
                }}
                placeholder={searchPlaceholder ?? t("dropdown_box.search_placeholder")}
                placeholderTextColor={neutral.textSecondary}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                {...(searchAutoFocus ? { autoFocus: true } : {})}
                clearButtonMode="while-editing"
                onPressIn={notifyParentScrollForSearch}
                onFocus={notifyParentScrollForSearch}
              />
              <Pressable
                onPress={collapse}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t("common.close")}
              >
                <View style={styles.chevronUpWrap}>
                  <Icons.chevronDown size={22} color={neutral.textSecondary} />
                </View>
              </Pressable>
            </View>

            <ScrollView
              style={[styles.chipsScroll, { maxHeight: resultsMaxHeight }]}
              contentContainerStyle={
                sectionBlocks.length === 0 ? styles.listScrollContentEmpty : styles.chipsListContent
              }
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              nestedScrollEnabled
              showsVerticalScrollIndicator
              onContentSizeChange={(_w, ch) => {
                growPanelHeightIfNeeded(ch);
              }}
            >
              {sectionBlocks.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyText}>{t("dropdown_box.no_results")}</Text>
                </View>
              ) : (
                sectionBlocks.map((block, idx) => (
                  <View
                    key={block.sec.id}
                    style={sections.length === 1 ? styles.singleSectionBlock : undefined}
                  >
                    {sections.length > 1 ? (
                      <Text
                        style={[styles.sectionTitle, idx === 0 && styles.sectionTitleFirst]}
                        accessibilityRole="header"
                      >
                        {block.sec.title}
                      </Text>
                    ) : null}
                    {(block.sec.itemLayout ?? itemLayout) === "list" ? (
                      <>
                        {block.allVisible ? (
                          <Pressable
                            style={[
                              styles.listRow,
                              block.sec.selectedId === null && styles.listRowSelected,
                            ]}
                            onPress={() => handleSelect(block.sec.id, null)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: block.sec.selectedId === null }}
                          >
                            <View style={styles.listRowTextWrap}>
                              <Text
                                style={[
                                  styles.listRowTitle,
                                  block.sec.selectedId === null && styles.listRowTitleSelected,
                                ]}
                                numberOfLines={2}
                              >
                                {block.allLabel}
                              </Text>
                            </View>
                            <Icons.chevronForward size={20} color={neutral.textSecondary} />
                          </Pressable>
                        ) : null}
                        {block.filteredItems.map((it) => {
                          const selected = block.sec.selectedId === it.id;
                          return (
                            <Pressable
                              key={it.id}
                              style={[styles.listRow, selected && styles.listRowSelected]}
                              onPress={() => handleSelect(block.sec.id, it.id)}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                            >
                              <View style={styles.listRowTextWrap}>
                                <Text
                                  style={[styles.listRowTitle, selected && styles.listRowTitleSelected]}
                                  numberOfLines={2}
                                >
                                  {it.label}
                                </Text>
                                {it.detail ? (
                                  <Text style={styles.listRowDetail} numberOfLines={2}>
                                    {it.detail}
                                  </Text>
                                ) : null}
                                {typeof it.deviceCount === "number" ? (
                                  <Text style={styles.listRowMeta}>
                                    {t("staff_home.house_picker_device_prefix")}{" "}
                                    <Text style={styles.listRowMetaBold}>{it.deviceCount}</Text>
                                  </Text>
                                ) : null}
                              </View>
                              <Icons.chevronForward size={20} color={neutral.textSecondary} />
                            </Pressable>
                          );
                        })}
                      </>
                    ) : (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator
                        keyboardShouldPersistTaps="handled"
                        nestedScrollEnabled
                        contentContainerStyle={styles.chipRowContent}
                      >
                        {block.allVisible ? (
                          <Pressable
                            style={[
                              styles.chip,
                              block.sec.selectedId === null && styles.chipSelected,
                            ]}
                            onPress={() => handleSelect(block.sec.id, null)}
                            accessibilityRole="button"
                            accessibilityState={{ selected: block.sec.selectedId === null }}
                          >
                            <Text
                              style={[
                                styles.chipLabel,
                                block.sec.selectedId === null && styles.chipLabelSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {block.allLabel}
                            </Text>
                          </Pressable>
                        ) : null}
                        {block.filteredItems.map((it) => {
                          const selected = block.sec.selectedId === it.id;
                          return (
                            <Pressable
                              key={it.id}
                              style={[styles.chip, selected && styles.chipSelected]}
                              onPress={() => handleSelect(block.sec.id, it.id)}
                              accessibilityRole="button"
                              accessibilityState={{ selected }}
                            >
                              <Text
                                style={[styles.chipLabel, selected && styles.chipLabelSelected]}
                                numberOfLines={1}
                              >
                                {it.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: neutral.border,
    backgroundColor: neutral.surface,
  },
  triggerText: {
    ...appTypography.labelRowValue,
    flex: 1,
    color: neutral.text,
  },
  triggerAccent: {
    borderWidth: 1,
    borderColor: brandBlueMutedBorder,
    borderLeftWidth: 4,
    borderLeftColor: brandPrimary,
  },
  panelAccent: {
    borderWidth: 1,
    borderColor: brandBlueMutedBorder,
  },
  avoidingWrap: {
    alignSelf: "stretch",
    width: "100%",
  },
  singleSectionBlock: {
    paddingTop: 4,
  },
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: neutral.border,
    backgroundColor: neutral.surface,
    overflow: "hidden",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: neutral.border,
    backgroundColor: neutral.background,
  },
  chevronUpWrap: {
    transform: [{ rotate: "180deg" }],
  },
  searchInput: {
    ...appTypography.body,
    flex: 1,
    padding: 0,
    margin: 0,
    color: neutral.text,
    minHeight: 22,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  chipsListContent: {
    flexGrow: 0,
    paddingBottom: 8,
  },
  /** “Không có kết quả” — không flexGrow:1 để tránh ô trống cao cả viewport. */
  listScrollContentEmpty: {
    flexGrow: 0,
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  sectionTitle: {
    ...appTypography.captionStrong,
    color: neutral.textSecondary,
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitleFirst: {
    marginTop: 8,
  },
  chipRowContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 6,
    paddingRight: 16,
  },
  chip: {
    flexShrink: 0,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: neutral.background,
    borderWidth: 1,
    borderColor: neutral.border,
    maxWidth: 280,
  },
  chipSelected: {
    backgroundColor: brandTintBg,
    borderColor: brandPrimary,
  },
  chipLabel: {
    ...appTypography.body,
    color: neutral.text,
  },
  chipLabelSelected: {
    color: brandPrimary,
    fontWeight: "600",
  },
  emptyWrap: {
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  emptyText: {
    ...appTypography.secondary,
    color: neutral.textSecondary,
    textAlign: "center",
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: neutral.border,
    backgroundColor: neutral.surface,
    gap: 10,
  },
  listRowSelected: {
    backgroundColor: brandTintBg,
  },
  listRowTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  listRowTitle: {
    ...appTypography.body,
    fontWeight: "600",
    color: neutral.text,
  },
  listRowTitleSelected: {
    color: brandPrimary,
  },
  listRowDetail: {
    ...appTypography.secondary,
    color: neutral.textSecondary,
    marginTop: 4,
  },
  listRowMeta: {
    ...appTypography.secondary,
    color: neutral.textSecondary,
    marginTop: 6,
  },
  listRowMetaBold: {
    ...appTypography.listTitle,
    fontWeight: "700",
    color: brandPrimary,
  },
});
