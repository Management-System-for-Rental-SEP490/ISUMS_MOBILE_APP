import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import { useTranslation } from "react-i18next";
import Icons from "../theme/icon";
import { brandPrimary, brandTintBg, neutral } from "../theme/color";
import { appTypography } from "../utils";

export type DropdownBoxItem = { id: string; label: string };

export type DropdownBoxSection = {
  id: string;
  title: string;
  items: DropdownBoxItem[];
  selectedId: string | null;
  showAllOption?: boolean;
  allLabel?: string;
};

export type DropdownBoxProps = {
  sections: DropdownBoxSection[];
  summary: string;
  onSelect: (sectionId: string, itemId: string | null) => void;
  style?: StyleProp<ViewStyle>;
  onAfterSelect?: (sectionId: string, itemId: string | null) => void;
  /** Bù header/status bar cho KeyboardAvoidingView (iOS). VD: `insets.top + 52`. */
  keyboardVerticalOffset?: number;
  /** Cuộn list/scroll cha khi focus ô tìm (tránh bàn phím che). */
  onSearchInputFocus?: () => void;
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
  return norm(item.label).includes(n) || norm(item.id).includes(n);
}

function itemScore(item: DropdownBoxItem, q: string): number {
  const query = norm(q);
  if (!query) return 0;
  const label = norm(item.label);
  const id = norm(item.id);
  if (label === query) return 120;
  if (label.startsWith(query)) return 100;
  if (label.includes(query)) return 80;
  if (id === query) return 70;
  if (id.startsWith(query)) return 60;
  if (id.includes(query)) return 40;
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
 * Gom nhiều bộ lọc: mở ngay tại chỗ — thanh tìm kiếm + chip theo thứ tự BE.
 */
export function DropdownBox({
  sections,
  summary,
  onSelect,
  style,
  onAfterSelect,
  keyboardVerticalOffset = 0,
  onSearchInputFocus,
}: DropdownBoxProps) {
  const { t } = useTranslation();
  const { height: windowH } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  /** Tránh gọi callback cuộn cha lặp nhiều lần khi search input focus lại. */
  const parentScrollForSearchDoneRef = useRef(false);

  useEffect(() => {
    if (expanded) setSearch("");
  }, [expanded]);

  useEffect(() => {
    if (!expanded) parentScrollForSearchDoneRef.current = false;
  }, [expanded]);

  const notifyParentScrollForSearch = useCallback(() => {
    if (!onSearchInputFocus) return;
    if (parentScrollForSearchDoneRef.current) return;
    parentScrollForSearchDoneRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => onSearchInputFocus());
    });
  }, [onSearchInputFocus]);

  const defaultAllLabel = t("staff_home.all_devices_category_all");
  const sectionBlocks = useMemo(
    () => buildSectionBlocks(sections, search, defaultAllLabel),
    [sections, search, defaultAllLabel]
  );

  const resultsViewportHeight = Math.min(360, Math.round(windowH * 0.45));

  const collapse = useCallback(() => setExpanded(false), []);

  const handleSelect = useCallback(
    (sectionId: string, itemId: string | null) => {
      onSelect(sectionId, itemId);
      setExpanded(false);
      onAfterSelect?.(sectionId, itemId);
    },
    [onSelect, onAfterSelect]
  );

  if (sections.length === 0) {
    return null;
  }

  return (
    <View style={style}>
      {!expanded ? (
        <Pressable
          onPress={() => setExpanded(true)}
          style={styles.trigger}
          accessibilityRole="button"
          accessibilityLabel={`${t("dropdown_box.open_a11y")}: ${summary}`}
        >
          <Text style={styles.triggerText} numberOfLines={2}>
            {summary}
          </Text>
          <Icons.chevronDown size={22} color={neutral.textSecondary} />
        </Pressable>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={keyboardVerticalOffset}
          style={styles.avoidingWrap}
        >
          <View style={styles.panel}>
            <View style={styles.searchRow}>
              <Icons.search size={20} color={neutral.iconMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder={t("dropdown_box.search_placeholder")}
                placeholderTextColor={neutral.textSecondary}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
                clearButtonMode="while-editing"
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
              style={[styles.chipsScroll, { height: resultsViewportHeight }]}
              contentContainerStyle={sectionBlocks.length === 0 ? styles.chipsScrollContentEmpty : undefined}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              nestedScrollEnabled
              showsVerticalScrollIndicator
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
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  avoidingWrap: {
    alignSelf: "stretch",
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
  chipsScroll: {},
  chipsScrollContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
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
});
