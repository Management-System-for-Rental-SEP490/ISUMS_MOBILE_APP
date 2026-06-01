import React, { useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { AssetItemFromApi } from "../../../../shared/types/api";
import { normalizeAssetItemStatusFromApi } from "../../../../shared/types/api";
import { useAssetItems, asAssetItemArray } from "../../../../shared/hooks";
import Icons from "../../../../shared/theme/icon";
import { neutral } from "../../../../shared/theme/color";
import { RefreshLogoOverlay } from "@shared/components/RefreshLogoOverlay";
import { ticketAssetSelectStyles as styles } from "./ticketStyles";

export type TicketAssetSelection = { id: string; displayName: string };

type Props = {
  houseId: string;
  value: TicketAssetSelection | null;
  onChange: (next: TicketAssetSelection | null) => void;
};

function normalizeName(item: AssetItemFromApi, unnamedLabel: string): string {
  const n = item.displayName?.trim();
  return n || unnamedLabel;
}

export function TicketAssetSelect({ houseId, value, onChange }: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  /**
   * Dùng useAssetItems (React Query) thay vì fetch thủ công mỗi lần mở modal.
   * - Lần đầu mở: fetch và cache (staleTime 5 phút từ App.tsx defaultOptions).
   * - Lần mở tiếp theo trong 5 phút: trả cache tức thì, không gọi thêm request.
   * - enabled=true luôn (fetch background ngay khi component mount — modal chưa mở
   *   nhưng asset sẽ sẵn sàng trong cache khi user bấm chọn thiết bị).
   */
  const {
    data: assetData,
    isLoading: loading,
    isError: loadError,
    refetch,
  } = useAssetItems({ houseId: houseId || undefined });

  const items: AssetItemFromApi[] = asAssetItemArray(assetData?.data);

  const handleOpen = () => {
    setQuery("");
    setOpen(true);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const name = normalizeName(it, t("ticket.asset_unnamed")).toLowerCase();
      const serial = (it.serialNumber ?? "").toLowerCase();
      return name.includes(q) || serial.includes(q) || it.id.toLowerCase().includes(q);
    });
  }, [items, query, t]);

  const onPick = (it: AssetItemFromApi) => {
    onChange({ id: it.id, displayName: normalizeName(it, t("ticket.asset_unnamed")) });
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={handleOpen}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={t("ticket.asset_field_label")}
      >
        <Text
          style={[styles.triggerText, !value && styles.triggerPlaceholder]}
          numberOfLines={2}
        >
          {value ? value.displayName : t("ticket.asset_placeholder")}
        </Text>
        <Icons.chevronDown size={20} color={neutral.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 16 : 0}
        >
          <Pressable style={styles.modalRoot} onPress={() => setOpen(false)}>
            <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]} onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>{t("ticket.asset_picker_title")}</Text>
                <TouchableOpacity onPress={() => setOpen(false)} hitSlop={12} accessibilityRole="button">
                  <Icons.close size={22} color={neutral.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.searchWrap}>
                <Icons.search size={20} color={neutral.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t("ticket.asset_search_placeholder")}
                  placeholderTextColor={neutral.textMuted}
                  value={query}
                  onChangeText={setQuery}
                  autoCorrect={false}
                  autoCapitalize="none"
                />
              </View>
              {loading ? (
                <View style={[styles.loadingBox, { position: "relative", minHeight: 120 }]}>
                  <RefreshLogoOverlay visible mode="page" />
                </View>
              ) : loadError ? (
                <TouchableOpacity onPress={() => void refetch()} style={{ padding: 16, alignItems: "center" }}>
                  <Text style={styles.emptyText}>{t("ticket.asset_load_error")}</Text>
                  <Text style={[styles.emptyText, { color: neutral.textSecondary, marginTop: 4, fontSize: 13 }]}>{t("common.tap_to_retry", "Chạm để thử lại")}</Text>
                </TouchableOpacity>
              ) : (
                <FlatList
                  style={styles.list}
                  data={filtered}
                  keyExtractor={(it) => it.id}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>{t("ticket.asset_empty_list")}</Text>
                  }
                  renderItem={({ item: it }) => {
                    const broken = normalizeAssetItemStatusFromApi(it.status) === "BROKEN";
                    return (
                      <TouchableOpacity
                        style={[styles.assetRow, broken && styles.assetRowBroken]}
                        onPress={() => onPick(it)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.assetRowTitle, broken && styles.assetRowTitleBroken]}
                          numberOfLines={2}
                        >
                          {normalizeName(it, t("ticket.asset_unnamed"))}
                        </Text>
                        {broken ? (
                          <Text style={styles.assetRowSub} numberOfLines={1}>
                            {t("staff_item_create.status_broken")}
                          </Text>
                        ) : null}
                        {(it.serialNumber ?? "").trim() ? (
                          <Text style={styles.assetRowSub} numberOfLines={1}>
                            {t("staff_item_create.serial_number_label")}: {it.serialNumber}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
