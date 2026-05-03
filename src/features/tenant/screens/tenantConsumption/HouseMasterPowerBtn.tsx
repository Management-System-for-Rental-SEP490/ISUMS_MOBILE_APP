/**
 * Nút "công tắc tổng" cấp nhà — chỉ hiển thị ở house level (selectedAreaId === "all").
 * Tự fetch trạng thái từng area, derive isAnyOn/isAllOff, xác nhận trước khi toggle.
 * Partial failure được hiển thị để user biết area nào cần retry.
 */
import React, { useCallback, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import { CustomAlert } from "../../../../shared/components/alert";
import { RefreshLogoInline } from "@shared/components/RefreshLogoOverlay";
import {
  BRAND_DANGER,
  consumptionPowerOnGreen,
  neutral,
} from "../../../../shared/theme/color";
import {
  useHouseMasterPower,
  type HouseMasterPowerArea,
} from "../../hooks/useHouseMasterPower";

export type HouseMasterPowerBtnProps = {
  houseId: string | null;
  /** Tất cả area có IoT node trong nhà. Btn bị ẩn nếu rỗng. */
  areas: HouseMasterPowerArea[];
  /** Optional: callback sau khi toggle thành công ít nhất 1 area — dùng để trigger re-fetch
   *  các hook hàng xóm (telemetry, distribution…). */
  onAfterToggle?: () => void;
};

const HouseMasterPowerBtn = ({
  houseId,
  areas,
  onAfterToggle,
}: HouseMasterPowerBtnProps) => {
  const { t } = useTranslation();
  const master = useHouseMasterPower({ houseId, areas });

  const areaCount = areas.length;
  const areaNameById = useMemo(() => {
    const m = new Map<string, string>();
    areas.forEach((a) => m.set(a.id, a.name ?? a.id));
    return m;
  }, [areas]);

  // Label — dựa trên isAnyOn: còn area ON → nút đỏ "Tắt tổng"; all OFF → nút xanh "Bật tổng".
  const isOffMode = master.isAnyOn; // đang có area ON → nhấn sẽ OFF
  const btnLabel = isOffMode
    ? t("consumption.master_power_off_btn")
    : t("consumption.master_power_on_btn");
  const btnColor = isOffMode ? BRAND_DANGER : consumptionPowerOnGreen;

  const runToggle = useCallback(
    async (action: "ON" | "OFF") => {
      const result = await master.toggleAll(action);
      const okCount = Object.keys(result.succeeded).length;
      const failCount = Object.keys(result.failed).length;

      if (failCount === 0) {
        CustomAlert.alert(
          t("consumption.master_power_done_title"),
          action === "OFF"
            ? t("consumption.master_power_off_success", { n: okCount })
            : t("consumption.master_power_on_success", { n: okCount }),
          [{ text: t("common.close") }],
          { type: "success" }
        );
      } else {
        const failedLines = Object.entries(result.failed)
          .map(([id, msg]) => `• ${areaNameById.get(id) ?? id}: ${msg}`)
          .join("\n");
        CustomAlert.alert(
          t("consumption.master_power_partial_title"),
          t("consumption.master_power_partial_body", {
            ok: okCount,
            fail: failCount,
            total: okCount + failCount,
            failedList: failedLines,
          }),
          [{ text: t("common.close") }],
          { type: failCount === areaCount ? "error" : "warning" }
        );
      }

      if (okCount > 0) onAfterToggle?.();
    },
    [master, t, areaNameById, areaCount, onAfterToggle]
  );

  const onPress = useCallback(() => {
    if (master.toggling || master.loading) return;
    if (areaCount === 0) return;

    const action: "ON" | "OFF" = isOffMode ? "OFF" : "ON";
    const title = isOffMode
      ? t("consumption.master_power_confirm_off_title")
      : t("consumption.master_power_confirm_on_title");
    const body = isOffMode
      ? t("consumption.master_power_confirm_off_body", { n: areaCount })
      : t("consumption.master_power_confirm_on_body", { n: areaCount });

    CustomAlert.alert(
      title,
      body,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: isOffMode
            ? t("consumption.master_power_off_btn")
            : t("consumption.master_power_on_btn"),
          style: isOffMode ? "destructive" : "default",
          onPress: () => {
            void runToggle(action);
          },
        },
      ],
      { type: isOffMode ? "warning" : "info" }
    );
  }, [master.toggling, master.loading, areaCount, isOffMode, t, runToggle]);

  if (areaCount === 0) return null;

  const disabled = master.toggling || master.loading;

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={[
          styles.btn,
          { backgroundColor: btnColor },
          disabled ? styles.btnDisabled : null,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={btnLabel}
        accessibilityState={{ disabled, busy: master.toggling }}
      >
        {master.toggling ? (
          <RefreshLogoInline logoPx={18} showLabel={false} />
        ) : (
          <Text style={styles.btnTxt}>{btnLabel}</Text>
        )}
      </TouchableOpacity>
      <Text style={styles.subTxt} numberOfLines={2}>
        {master.loading
          ? t("consumption.master_power_loading")
          : t("consumption.master_power_scope", { n: areaCount })}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 4,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: neutral.black,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  btnDisabled: { opacity: 0.7 },
  btnTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: neutral.surface,
    letterSpacing: 0.3,
  },
  subTxt: {
    fontSize: 11,
    fontWeight: "600",
    color: neutral.slate500,
    marginTop: 8,
    textAlign: "center",
  },
});

export default React.memo(HouseMasterPowerBtn);
