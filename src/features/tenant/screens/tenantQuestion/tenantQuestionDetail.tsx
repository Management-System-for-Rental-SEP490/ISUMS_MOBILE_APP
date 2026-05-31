import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../../shared/types";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
import { getIssueResponseContentForUi } from "../../../../shared/utils/issueTicketLocalizedText";
import Icons from "../../../../shared/theme/icon";
import { neutral } from "../../../../shared/theme/color";
import { tenantQuestionDetailStyles as styles } from "./tenantQuestionStyles";
import { getIssueResponseById } from "../../../../shared/services/issuesApi";
import type { IssueTicketResponseFromApi } from "../../../../shared/types/api";
import {
  StackScreenTitleBadge,
  StackScreenTitleBarBalance,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";

type Route = RouteProp<RootStackParamList, "TenantQuestionDetail">;
type Nav = NativeStackNavigationProp<RootStackParamList, "TenantQuestionDetail">;

const TenantQuestionDetailScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const r = params.response;
  const [localizedResponse, setLocalizedResponse] =
    useState<IssueTicketResponseFromApi>(r);
  const zoneLabel = params.zoneLabel?.trim() || null;

  const contentDisplay = useMemo(
    () => getIssueResponseContentForUi(localizedResponse),
    [localizedResponse, i18n.language]
  );

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  useEffect(() => {
    let cancelled = false;
    setLocalizedResponse(r);
    void getIssueResponseById(r.id)
      .then((next) => {
        if (!cancelled && next) setLocalizedResponse(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [r, i18n.language]);

  return (
    <View style={styles.container}>
      <StackScreenTitleHeaderStrip>
        <View style={stackScreenTitleRowStyle}>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icons.chevronBack size={24} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
          <View style={stackScreenTitleCenterSlotStyle}>
            <StackScreenTitleBadge numberOfLines={1}>
              {t("tenant_question_detail.screen_title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 28) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{contentDisplay.trim() || "—"}</Text>
          <View style={styles.heroDateRow}>
            <Icons.clock size={15} color={neutral.textMuted} />
            <Text style={styles.heroDateText}>
              {t("tenant_question_detail.sent_at")}: {formatTenantIssueDateTime(localizedResponse.createdAt, locale)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("tenant_question_detail.section_meta")}</Text>
        <View style={styles.panel}>
          {zoneLabel ? (
            <View style={styles.panelRow}>
              <Text style={styles.fieldLabel}>{t("tenant_question_detail.field_zone")}</Text>
              <View style={styles.zoneBadge}>
                <Icons.place size={14} color={neutral.slate500} />
                <Text style={styles.zoneBadgeText} numberOfLines={2}>
                  {zoneLabel}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={[styles.panelRow, styles.panelRowLast]}>
            <Text style={styles.fieldLabel}>{t("tenant_question_detail.field_content")}</Text>
            <Text style={styles.fieldValue} selectable>
              {contentDisplay}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TenantQuestionDetailScreen;
