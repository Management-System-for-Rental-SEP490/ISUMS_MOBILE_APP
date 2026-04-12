/**
 * Banner cảnh báo IoT toàn app (tenant): có cảnh báo chưa xử lý thì hiện trên mọi màn
 * (trừ khi đang ở trang Thông báo để không che danh sách).
 * Chạm thẻ → gỡ + chuyển tới NotificationScreen; chạm nền tối → chỉ gỡ.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  TouchableWithoutFeedback,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { navigationRef } from "../../../navigation/navigationRef";
import { useTenantContext } from "../../../shared/hooks";
import { useTenantAlerts } from "../hooks/useTenantAlerts";
import { useHomeIotAlertDismissStore } from "../../../store/useHomeIotAlertDismissStore";
import { dismissIotHomeBannerForAlert } from "../utils/dismissIotHomeBanner";
import { getNotificationAlertLevelStyle } from "../../../shared/theme/color";
import Icons from "../../../shared/theme/icon";
import homeStyles from "../screens/tenantHome/homeStyles";

export function TenantIotAlertOverlay() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { houseId: contextHouseId } = useTenantContext();

  const { latestAlert: latestIotAlert } = useTenantAlerts({
    houseId: contextHouseId ?? null,
  });

  const dismissedHomeIotAlertId = useHomeIotAlertDismissStore((s) =>
    contextHouseId ? s.dismissedAlertIdByHouseId[contextHouseId] : undefined
  );

  const [activeRouteName, setActiveRouteName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const sync = () => {
      if (!navigationRef.isReady()) return;
      setActiveRouteName(navigationRef.getCurrentRoute()?.name);
    };
    sync();
    const unsub = navigationRef.addListener("state", sync);
    return unsub;
  }, []);

  const showSheet = Boolean(
    contextHouseId &&
      latestIotAlert &&
      !latestIotAlert.resolved &&
      dismissedHomeIotAlertId !== latestIotAlert.alertId &&
      activeRouteName !== "NotificationScreen"
  );

  const dismissSheet = useCallback(() => {
    const hid = contextHouseId;
    const id = latestIotAlert?.alertId;
    if (hid && id) dismissIotHomeBannerForAlert(hid, id);
  }, [contextHouseId, latestIotAlert?.alertId]);

  const openNotificationAndDismiss = useCallback(() => {
    const hid = contextHouseId;
    const id = latestIotAlert?.alertId;
    if (hid && id) dismissIotHomeBannerForAlert(hid, id);
    if (navigationRef.isReady()) {
      navigationRef.navigate("NotificationScreen");
    }
  }, [contextHouseId, latestIotAlert?.alertId]);

  const levelLabel = useCallback(
    (level: string) => {
      const L = String(level ?? "").trim().toUpperCase();
      if (L === "CRITICAL") return t("notification.level_critical");
      if (L === "WARNING") return t("notification.level_warning");
      if (L === "HIGH") return t("notification.level_high");
      if (L === "MEDIUM") return t("notification.level_medium");
      if (L === "LOW") return t("notification.level_low");
      return t("notification.level_info");
    },
    [t]
  );

  if (!showSheet || !latestIotAlert) return null;

  const levelStyle = getNotificationAlertLevelStyle(latestIotAlert.level);

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismissSheet}
    >
      <View style={homeStyles.iotHomeAlertModalWrap}>
        <View
          style={[
            homeStyles.iotHomeAlertCardOuter,
            { paddingTop: Math.max(12, insets.top + 8) },
          ]}
        >
          <Pressable
            onPress={openNotificationAndDismiss}
            style={[homeStyles.iotHomeAlertCard, { borderLeftColor: levelStyle.fg }]}
            accessibilityRole="button"
            accessibilityLabel={`${latestIotAlert.title}. ${t("home.iot_alert_overlay_a11y_open")}`}
          >
            <View style={homeStyles.iotHomeAlertCardTop}>
              <View
                style={[
                  homeStyles.iotHomeAlertIconBubble,
                  { backgroundColor: levelStyle.bg },
                ]}
              >
                <Icons.notification size={22} color={levelStyle.fg} />
              </View>
              <View style={homeStyles.iotHomeAlertTextBlock}>
                <Text style={homeStyles.iotHomeAlertTitle} numberOfLines={2}>
                  {latestIotAlert.title}
                </Text>
                <Text style={homeStyles.iotHomeAlertSub} numberOfLines={2}>
                  {(latestIotAlert.areaName?.trim()
                    ? latestIotAlert.areaName.trim()
                    : t("notification.area_all"))}{" "}
                  · {levelLabel(latestIotAlert.level)}
                </Text>
              </View>
            </View>
            <Text style={homeStyles.iotHomeAlertHint}>{t("home.iot_alert_overlay_hint")}</Text>
          </Pressable>
        </View>
        <TouchableWithoutFeedback
          onPress={dismissSheet}
          accessibilityRole="button"
          accessibilityLabel={t("home.iot_alert_overlay_a11y_backdrop")}
        >
          <View style={homeStyles.iotHomeAlertBackdropTap} />
        </TouchableWithoutFeedback>
      </View>
    </Modal>
  );
}
