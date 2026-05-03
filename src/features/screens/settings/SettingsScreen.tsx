import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { CustomAlert } from "../../../shared/components/alert";
import { RefreshLogoInline } from "@shared/components/RefreshLogoOverlay";
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
import { brandPrimary, brandSecondary, brandTintBg, neutral } from "../../../shared/theme/color";
import { RootStackParamList } from "../../../shared/types";
import { appTypography } from "../../../shared/utils/typography";
import {
  AppLocaleCode,
  toAppLocaleCode,
} from "../../../shared/utils/resolveLocalizedJsonString";
import { useUpdateUserLanguageMutation } from "../../../shared/hooks";

type SettingsNavigationProp = NativeStackNavigationProp<RootStackParamList, "SettingsScreen">;

const LANGUAGE_OPTIONS: AppLocaleCode[] = ["vi", "en", "ja"];

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavigationProp>();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const [changingLanguage, setChangingLanguage] = useState<AppLocaleCode | null>(null);
  const updateLanguageMutation = useUpdateUserLanguageMutation();
  const updateLanguageAsync = updateLanguageMutation.mutateAsync;

  const currentLanguage = useMemo(
    () => toAppLocaleCode(i18n.language),
    [i18n.language]
  );

  const handleChangeLanguage = useCallback(
    async (language: AppLocaleCode) => {
      if (language === currentLanguage || changingLanguage != null) return;
      setChangingLanguage(language);
      try {
        await updateLanguageAsync(language);
        await i18n.changeLanguage(language);
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const root = String(query.queryKey[0] ?? "");
            return root === "user" ||
              root === "houses" ||
              root === "assetCategories" ||
              root === "assetItems" ||
              root === "iotDevices";
          },
        });
      } catch {
        CustomAlert.alert(
          t("common.error"),
          t("settings.language_update_error"),
          [{ text: t("common.close") }],
          { type: "error" }
        );
      } finally {
        setChangingLanguage(null);
      }
    },
    [changingLanguage, currentLanguage, i18n, queryClient, t, updateLanguageAsync]
  );

  return (
    <View style={styles.screen}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.75}
            >
              <Icons.chevronBack size={22} color={stackScreenTitleOnBrandIconColor} />
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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t("settings.language_section")}</Text>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerIconWrap}>
              <Icons.language size={22} color={brandPrimary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.cardTitle}>{t("settings.language_title")}</Text>
              <Text style={styles.cardDescription}>
                {t("settings.language_description")}
              </Text>
            </View>
          </View>

          <View style={styles.optionList}>
            {LANGUAGE_OPTIONS.map((language) => {
              const active = currentLanguage === language;
              const loading = changingLanguage === language;
              return (
                <TouchableOpacity
                  key={language}
                  style={[styles.languageRow, active && styles.languageRowActive]}
                  onPress={() => void handleChangeLanguage(language)}
                  disabled={changingLanguage != null}
                  activeOpacity={0.82}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active, disabled: changingLanguage != null }}
                >
                  <View style={[styles.languageIcon, active && styles.languageIconActive]}>
                    <Text style={[styles.languageCode, active && styles.languageCodeActive]}>
                      {language.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.languageTextCol}>
                    <Text style={styles.languageName}>
                      {t(`settings.language_${language}`)}
                    </Text>
                    {active ? (
                      <Text style={styles.languageCurrent}>
                        {t("settings.language_current")}
                      </Text>
                    ) : null}
                  </View>
                  {loading ? (
                    <RefreshLogoInline logoPx={18} />
                  ) : active ? (
                    <Icons.check size={22} color={brandSecondary} />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Notifications section — links into the IoT alert preference
            screens (multi-channel routing, voice consent, escalation). */}
        <Text style={styles.sectionTitle}>
          {t("settings.notifications_section", "Thông báo")}
        </Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate("NotificationPreferencesScreen")}
            activeOpacity={0.82}
            accessibilityRole="button"
          >
            <View style={styles.headerIconWrap}>
              <Icons.notification size={22} color={brandPrimary} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>
                {t("settings.notifications_prefs_title", "Cài đặt thông báo")}
              </Text>
              <Text style={styles.menuDesc}>
                {t(
                  "settings.notifications_prefs_desc",
                  "Kênh nhận, gói đăng ký, voice consent, escalation"
                )}
              </Text>
            </View>
            <Icons.chevronForward size={20} color={neutral.textMuted} />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => navigation.navigate("VoiceCallHistoryScreen")}
            activeOpacity={0.82}
            accessibilityRole="button"
          >
            <View style={styles.headerIconWrap}>
              <Icons.call size={22} color={brandPrimary} />
            </View>
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>
                {t("settings.voice_history_title", "Lịch sử cuộc gọi")}
              </Text>
              <Text style={styles.menuDesc}>
                {t(
                  "settings.voice_history_desc",
                  "Cuộc gọi cảnh báo IoT đã nhận"
                )}
              </Text>
            </View>
            <Icons.chevronForward size={20} color={neutral.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: neutral.canvasMuted,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 96,
  },
  sectionTitle: {
    ...appTypography.sectionHeading,
    fontWeight: "600",
    color: neutral.textSecondary,
    marginBottom: 10,
    marginLeft: 10,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: neutral.surface,
    borderRadius: 12,
    borderCurve: "continuous",
    padding: 16,
    shadowColor: neutral.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: "continuous",
    backgroundColor: brandTintBg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    ...appTypography.itemTitle,
    color: neutral.textBody,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardDescription: {
    ...appTypography.secondary,
    color: neutral.textMuted,
    lineHeight: 18,
  },
  optionList: {
    gap: 10,
  },
  languageRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: neutral.border,
    backgroundColor: neutral.backgroundSubtle,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  languageRowActive: {
    borderColor: brandPrimary,
    backgroundColor: brandTintBg,
  },
  languageIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderCurve: "continuous",
    backgroundColor: neutral.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: neutral.borderMuted,
  },
  languageIconActive: {
    borderColor: brandPrimary,
  },
  languageCode: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
    color: neutral.textMuted,
  },
  languageCodeActive: {
    color: brandSecondary,
  },
  languageTextCol: {
    flex: 1,
    minWidth: 0,
  },
  languageName: {
    ...appTypography.modalListItem,
    color: neutral.textBody,
    fontWeight: "700",
  },
  languageCurrent: {
    ...appTypography.secondary,
    color: brandSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  // Notifications/voice menu — chevron rows that route into dedicated
  // screens (NotificationPreferencesScreen, VoiceCallHistoryScreen).
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  menuDivider: {
    height: 1,
    backgroundColor: brandTintBg,
    marginVertical: 4,
  },
  menuTextCol: {
    flex: 1,
    minWidth: 0,
  },
  menuTitle: {
    ...appTypography.itemTitle,
    color: neutral.textBody,
    fontWeight: "700",
  },
  menuDesc: {
    ...appTypography.secondary,
    color: neutral.textSecondary,
    marginTop: 2,
  },
});

export default SettingsScreen;
