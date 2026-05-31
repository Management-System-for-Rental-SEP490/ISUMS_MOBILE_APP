import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CustomAlert } from "../../../shared/components/alert";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../shared/components/StackScreenTitleBadge";
import Icons from "../../../shared/theme/icon";
import { RootStackParamList } from "../../../shared/types";
import {
  AppLocaleCode,
  toAppLocaleCode,
} from "../../../shared/utils/resolveLocalizedJsonString";
import { useUpdateUserLanguageMutation } from "../../../shared/hooks";
import { useColors, useTypography } from "../../../shared/design";
import { useHaptic } from "../../../shared/hooks/useHaptic";
import {
  type DomainKey,
  type IotTimeRange,
  type LiveInterval,
  usePreferencesStore,
} from "../../../store/usePreferencesStore";
import type { FontScaleToken } from "../../../shared/design/tokens";
import { SettingSection } from "./components/SettingSection";
import { SettingRow } from "./components/SettingRow";
import { SettingPickerRow } from "./components/SettingPickerRow";

type SettingsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SettingsScreen"
>;

const LANGUAGES: AppLocaleCode[] = ["vi", "en", "ja"];

const DOMAINS: DomainKey[] = ["electric", "water", "air", "security", "gas"];

const FONT_SCALES: FontScaleToken[] = ["xs", "sm", "base", "lg", "xl", "2xl"];

const TIME_RANGES: IotTimeRange[] = ["1h", "24h", "7d", "30d", "90d"];

const LIVE_INTERVALS: LiveInterval[] = [5, 10, 30, 60, 0];

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const typography = useTypography();
  const haptic = useHaptic();

  const themeMode = usePreferencesStore((s) => s.themeMode);
  const setThemeMode = usePreferencesStore((s) => s.setThemeMode);
  const fontScale = usePreferencesStore((s) => s.fontScale);
  const setFontScale = usePreferencesStore((s) => s.setFontScale);
  const density = usePreferencesStore((s) => s.density);
  const setDensity = usePreferencesStore((s) => s.setDensity);
  const motion = usePreferencesStore((s) => s.motion);
  const setMotion = usePreferencesStore((s) => s.setMotion);
  const hapticEnabled = usePreferencesStore((s) => s.hapticEnabled);
  const setHapticEnabled = usePreferencesStore((s) => s.setHapticEnabled);
  const hapticIntensity = usePreferencesStore((s) => s.hapticIntensity);
  const setHapticIntensity = usePreferencesStore((s) => s.setHapticIntensity);
  const alertSound = usePreferencesStore((s) => s.alertSoundEnabled);
  const setAlertSound = usePreferencesStore((s) => s.setAlertSoundEnabled);
  const iot = usePreferencesStore((s) => s.iot);
  const updateIot = usePreferencesStore((s) => s.updateIot);
  const notifications = usePreferencesStore((s) => s.notifications);
  const updateNotifications = usePreferencesStore(
    (s) => s.updateNotifications,
  );
  const setDomainNotification = usePreferencesStore(
    (s) => s.setDomainNotification,
  );
  const privacy = usePreferencesStore((s) => s.privacy);
  const updatePrivacy = usePreferencesStore((s) => s.updatePrivacy);
  const display = usePreferencesStore((s) => s.display);
  const updateDisplay = usePreferencesStore((s) => s.updateDisplay);
  const resetAll = usePreferencesStore((s) => s.resetAll);

  const [changingLanguage, setChangingLanguage] = useState<AppLocaleCode | null>(
    null,
  );
  const updateLanguageMutation = useUpdateUserLanguageMutation();
  const updateLanguageAsync = updateLanguageMutation.mutateAsync;

  const currentLanguage = useMemo(
    () => toAppLocaleCode(i18n.language),
    [i18n.language],
  );

  const handleChangeLanguage = useCallback(
    async (language: AppLocaleCode) => {
      if (language === currentLanguage || changingLanguage != null) return;
      setChangingLanguage(language);
      haptic("selection");
      try {
        await updateLanguageAsync(language);
        await i18n.changeLanguage(language);
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const root = String(query.queryKey[0] ?? "");
            return [
              "user",
              "houses",
              "assetCategories",
              "assetItems",
              "iotDevices",
            ].includes(root);
          },
        });
      } catch {
        CustomAlert.alert(
          t("common.error"),
          t("settings.language_update_error"),
          [{ text: t("common.close") }],
          { type: "error" },
        );
      } finally {
        setChangingLanguage(null);
      }
    },
    [
      changingLanguage,
      currentLanguage,
      haptic,
      i18n,
      queryClient,
      t,
      updateLanguageAsync,
    ],
  );

  const confirmReset = useCallback(() => {
    CustomAlert.alert(
      t("settings.reset_confirm_title"),
      t("settings.reset_confirm_message"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("settings.reset_confirm_action"),
          style: "destructive",
          onPress: () => {
            haptic("warning");
            resetAll();
          },
        },
      ],
      { type: "warning" },
    );
  }, [haptic, resetAll, t]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg.canvas }]}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
            >
              <Icons.chevronBack
                size={22}
                color={stackScreenTitleOnBrandIconColor}
              />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>
              {t("settings.title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection title={t("settings.appearance_section")}>
          <SettingPickerRow
            title={t("settings.theme_title")}
            description={t("settings.theme_description")}
            options={[
              { value: "system", label: t("settings.theme_system") },
              { value: "light", label: t("settings.theme_light") },
              { value: "dark", label: t("settings.theme_dark") },
            ]}
            value={themeMode}
            onChange={setThemeMode}
            showDivider
          />
          <SettingPickerRow
            title={t("settings.font_scale_title")}
            description={t("settings.font_scale_description")}
            options={FONT_SCALES.map((value) => ({
              value,
              label: t(`settings.font_scale_${value}`),
            }))}
            value={fontScale}
            onChange={setFontScale}
            showDivider
          />
          <SettingPickerRow
            title={t("settings.density_title")}
            description={t("settings.density_description")}
            options={[
              {
                value: "comfortable",
                label: t("settings.density_comfortable"),
              },
              { value: "compact", label: t("settings.density_compact") },
            ]}
            value={density}
            onChange={setDensity}
            showDivider
          />
          <SettingPickerRow
            title={t("settings.motion_title")}
            description={t("settings.motion_description")}
            options={[
              { value: "system", label: t("settings.motion_system") },
              { value: "full", label: t("settings.motion_full") },
              { value: "reduced", label: t("settings.motion_reduced") },
            ]}
            value={motion}
            onChange={setMotion}
          />
        </SettingSection>

        <SettingSection title={t("settings.language_section")}>
          {LANGUAGES.map((lang, idx) => {
            const active = currentLanguage === lang;
            return (
              <SettingRow
                key={lang}
                title={t(`settings.language_${lang}`)}
                description={
                  active ? t("settings.language_current") : undefined
                }
                variant={active ? "static" : "navigation"}
                disabled={changingLanguage != null}
                onPress={() => void handleChangeLanguage(lang)}
                showDivider={idx < LANGUAGES.length - 1}
                trailing={
                  active ? (
                    <Icons.check size={20} color={colors.brand.primary} />
                  ) : undefined
                }
              />
            );
          })}
        </SettingSection>

        <SettingSection title={t("settings.feedback_section")}>
          <SettingRow
            title={t("settings.haptic_title")}
            description={t("settings.haptic_description")}
            variant="toggle"
            toggled={hapticEnabled}
            onToggle={setHapticEnabled}
            showDivider
          />
          <SettingPickerRow
            title={t("settings.haptic_intensity_title")}
            options={[
              {
                value: "light",
                label: t("settings.haptic_intensity_light"),
              },
              {
                value: "medium",
                label: t("settings.haptic_intensity_medium"),
              },
            ]}
            value={hapticIntensity}
            onChange={setHapticIntensity}
            showDivider
          />
          <SettingRow
            title={t("settings.alert_sound_title")}
            description={t("settings.alert_sound_description")}
            variant="toggle"
            toggled={alertSound}
            onToggle={setAlertSound}
          />
        </SettingSection>

        <SettingSection title={t("settings.iot_section")}>
          <SettingPickerRow
            title={t("settings.iot_default_range_title")}
            description={t("settings.iot_default_range_description")}
            options={TIME_RANGES.map((value) => ({
              value,
              label: t(`settings.iot_range_${value}`),
            }))}
            value={iot.defaultRange}
            onChange={(defaultRange) => updateIot({ defaultRange })}
            showDivider
          />
          <SettingPickerRow
            title={t("settings.iot_live_interval_title")}
            description={t("settings.iot_live_interval_description")}
            options={LIVE_INTERVALS.map((value) => ({
              value,
              label: t(`settings.iot_live_interval_${value}`),
            }))}
            value={iot.liveIntervalSeconds}
            onChange={(liveIntervalSeconds) =>
              updateIot({ liveIntervalSeconds })
            }
            showDivider
          />
          <SettingPickerRow
            title={t("settings.iot_curve_style_title")}
            options={[
              { value: "smooth", label: t("settings.iot_curve_smooth") },
              { value: "linear", label: t("settings.iot_curve_linear") },
              { value: "step", label: t("settings.iot_curve_step") },
            ]}
            value={iot.chartCurveStyle}
            onChange={(chartCurveStyle) => updateIot({ chartCurveStyle })}
            showDivider
          />
          <SettingRow
            title={t("settings.iot_show_cost_title")}
            description={t("settings.iot_show_cost_description")}
            variant="toggle"
            toggled={iot.showCostEstimate}
            onToggle={(showCostEstimate) => updateIot({ showCostEstimate })}
            showDivider
          />
          <SettingRow
            title={t("settings.iot_show_carbon_title")}
            description={t("settings.iot_show_carbon_description")}
            variant="toggle"
            toggled={iot.showCarbonFootprint}
            onToggle={(showCarbonFootprint) =>
              updateIot({ showCarbonFootprint })
            }
            showDivider
          />
          <SettingRow
            title={t("settings.iot_show_confidence_title")}
            description={t("settings.iot_show_confidence_description")}
            variant="toggle"
            toggled={iot.showForecastConfidence}
            onToggle={(showForecastConfidence) =>
              updateIot({ showForecastConfidence })
            }
            showDivider
          />
          <SettingRow
            title={t("settings.iot_show_threshold_bands_title")}
            description={t("settings.iot_show_threshold_bands_description")}
            variant="toggle"
            toggled={iot.showThresholdBands}
            onToggle={(showThresholdBands) =>
              updateIot({ showThresholdBands })
            }
            showDivider
          />
          <SettingRow
            title={t("settings.iot_auto_refresh_title")}
            description={t("settings.iot_auto_refresh_description")}
            variant="toggle"
            toggled={iot.autoRefreshOnFocus}
            onToggle={(autoRefreshOnFocus) =>
              updateIot({ autoRefreshOnFocus })
            }
          />
        </SettingSection>

        <SettingSection title={t("settings.notifications_section")}>
          <SettingRow
            title={t("settings.push_enabled_title")}
            description={t("settings.push_enabled_description")}
            variant="toggle"
            toggled={notifications.pushEnabled}
            onToggle={(pushEnabled) => updateNotifications({ pushEnabled })}
            showDivider
          />
          <SettingRow
            title={t("settings.notifications_prefs_title")}
            description={t("settings.notifications_prefs_desc")}
            variant="navigation"
            onPress={() =>
              navigation.navigate("NotificationPreferencesScreen")
            }
            leadingIcon={
              <Icons.notification size={20} color={colors.brand.primary} />
            }
            showDivider
          />
          <SettingRow
            title={t("settings.voice_history_title")}
            description={t("settings.voice_history_desc")}
            variant="navigation"
            onPress={() => navigation.navigate("VoiceCallHistoryScreen")}
            leadingIcon={
              <Icons.call size={20} color={colors.brand.primary} />
            }
            showDivider
          />
          <SettingRow
            title={t("settings.quiet_hours_title")}
            description={t("settings.quiet_hours_description")}
            variant="toggle"
            toggled={notifications.quietHours.enabled}
            onToggle={(enabled) =>
              updateNotifications({
                quietHours: { ...notifications.quietHours, enabled },
              })
            }
            showDivider
          />
          <SettingRow
            title={t("settings.critical_override_title")}
            description={t("settings.critical_override_description")}
            variant="toggle"
            toggled={notifications.criticalOverride}
            onToggle={(criticalOverride) =>
              updateNotifications({ criticalOverride })
            }
            showDivider
          />
          <SettingRow
            title={t("settings.weekly_digest_title")}
            description={t("settings.weekly_digest_description")}
            variant="toggle"
            toggled={notifications.weeklyDigestEnabled}
            onToggle={(weeklyDigestEnabled) =>
              updateNotifications({ weeklyDigestEnabled })
            }
            showDivider
          />
          {DOMAINS.map((domain, idx) => (
            <SettingRow
              key={domain}
              title={t(`settings.domain_${domain}`)}
              variant="toggle"
              toggled={notifications.domainEnabled[domain]}
              onToggle={(enabled) => setDomainNotification(domain, enabled)}
              showDivider={idx < DOMAINS.length - 1}
            />
          ))}
        </SettingSection>

        <SettingSection title={t("settings.display_section")}>
          <SettingRow
            title={t("settings.live_badge_title")}
            description={t("settings.live_badge_description")}
            variant="toggle"
            toggled={display.showLiveBadge}
            onToggle={(showLiveBadge) => updateDisplay({ showLiveBadge })}
            showDivider
          />
          <SettingRow
            title={t("settings.area_sparklines_title")}
            description={t("settings.area_sparklines_description")}
            variant="toggle"
            toggled={display.showAreaSparklines}
            onToggle={(showAreaSparklines) =>
              updateDisplay({ showAreaSparklines })
            }
            showDivider
          />
          <SettingPickerRow
            title={t("settings.decimal_precision_title")}
            options={[
              { value: 0, label: t("settings.decimal_precision_0") },
              { value: 1, label: t("settings.decimal_precision_1") },
              { value: 2, label: t("settings.decimal_precision_2") },
            ]}
            value={display.decimalPrecision}
            onChange={(decimalPrecision) =>
              updateDisplay({
                decimalPrecision: decimalPrecision as 0 | 1 | 2,
              })
            }
            showDivider
          />
          <SettingPickerRow
            title={t("settings.time_format_title")}
            options={[
              { value: 1, label: t("settings.time_format_24h") },
              { value: 0, label: t("settings.time_format_12h") },
            ]}
            value={display.use24HourTime ? 1 : 0}
            onChange={(value) =>
              updateDisplay({ use24HourTime: value === 1 })
            }
            showDivider
          />
          <SettingPickerRow
            title={t("settings.week_starts_title")}
            options={[
              { value: 1, label: t("settings.week_starts_monday") },
              { value: 0, label: t("settings.week_starts_sunday") },
            ]}
            value={display.weekStartsOn}
            onChange={(value) =>
              updateDisplay({ weekStartsOn: value as 0 | 1 })
            }
          />
        </SettingSection>

        <SettingSection title={t("settings.privacy_section")}>
          <SettingRow
            title={t("settings.analytics_title")}
            description={t("settings.analytics_description")}
            variant="toggle"
            toggled={privacy.analyticsOptIn}
            onToggle={(analyticsOptIn) => updatePrivacy({ analyticsOptIn })}
            showDivider
          />
          <SettingRow
            title={t("settings.crash_reports_title")}
            description={t("settings.crash_reports_description")}
            variant="toggle"
            toggled={privacy.crashReportsOptIn}
            onToggle={(crashReportsOptIn) =>
              updatePrivacy({ crashReportsOptIn })
            }
            showDivider
          />
          <SettingRow
            title={t("settings.location_title")}
            description={t("settings.location_description")}
            variant="toggle"
            toggled={privacy.locationOptIn}
            onToggle={(locationOptIn) => updatePrivacy({ locationOptIn })}
          />
        </SettingSection>

        <SettingSection title={t("settings.advanced_section")}>
          <SettingRow
            title={t("settings.reset_title")}
            description={t("settings.reset_description")}
            variant="navigation"
            destructive
            onPress={confirmReset}
            leadingIcon={
              <Icons.warning size={20} color={colors.status.critical.fg} />
            }
          />
        </SettingSection>

        <Text
          style={[
            typography.caption,
            { color: colors.text.muted, textAlign: "center", marginTop: 12 },
          ]}
        >
          ISUMS Tenant · v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 96,
  },
});

export default SettingsScreen;
