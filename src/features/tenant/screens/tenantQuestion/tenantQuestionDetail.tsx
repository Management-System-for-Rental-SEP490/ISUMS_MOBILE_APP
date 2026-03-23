import React, { useMemo } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../../shared/types";
import { formatTenantIssueDateTime } from "../../../../shared/utils";
import Icons from "../../../../shared/theme/icon";
import { neutral } from "../../../../shared/theme/color";
import { tenantQuestionDetailStyles as styles } from "./tenantQuestionStyles";
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

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

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
          { paddingBottom: Math.max(insets.bottom, 28) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{r.content || "—"}</Text>
          <View style={styles.heroDateRow}>
            <Icons.clock size={15} color={neutral.textMuted} />
            <Text style={styles.heroDateText}>
              {t("tenant_question_detail.sent_at")}: {formatTenantIssueDateTime(r.createdAt, locale)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{t("tenant_question_detail.section_meta")}</Text>
        <View style={styles.panel}>
          <View style={styles.panelRow}>
            <Text style={styles.fieldLabel}>{t("tenant_question_detail.field_id")}</Text>
            <Text style={styles.fieldValueMono} selectable>
              {r.id}
            </Text>
          </View>
          <View style={styles.panelRow}>
            <Text style={styles.fieldLabel}>{t("tenant_question_detail.field_ticket_id")}</Text>
            <Text style={styles.fieldValueMono} selectable>
              {r.ticketId}
            </Text>
          </View>
          <View style={styles.panelRow}>
            <Text style={styles.fieldLabel}>{t("tenant_question_detail.field_actor_id")}</Text>
            <Text style={styles.fieldValueMono} selectable>
              {r.actorId}
            </Text>
          </View>
          <View style={styles.panelRow}>
            <Text style={styles.fieldLabel}>{t("tenant_question_detail.field_content")}</Text>
            <Text style={styles.fieldValue} selectable>
              {r.content ?? ""}
            </Text>
          </View>
          <View style={[styles.panelRow, styles.panelRowLast]}>
            <Text style={styles.fieldLabel}>{t("tenant_question_detail.field_created_at")}</Text>
            <Text style={styles.fieldValueMono} selectable>
              {r.createdAt}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default TenantQuestionDetailScreen;
