import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { getAssetItemsByHouseId } from "../../../../shared/services/assetItemApi";
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
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AssetItemFromApi[]>([]);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async () => {
    const hid = String(houseId || "").trim();
    if (!hid) return;
    setLoading(true);
    setLoadError(false);
    try {
      const res = await getAssetItemsByHouseId(hid);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLoadError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [houseId, i18n.language]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    load();
  }, [open, load]);

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
        onPress={() => setOpen(true)}
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
                <Text style={styles.emptyText}>{t("ticket.asset_load_error")}</Text>
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
