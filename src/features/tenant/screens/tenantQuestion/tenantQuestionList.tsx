import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  RootStackParamList,
  IssueTicketResponseFromApi,
} from "../../../../shared/types";
import { getIssueResponses, getTenantTickets } from "../../../../shared/services/issuesApi";
import Icons from "../../../../shared/theme/icon";
import { brandSecondary, neutral } from "../../../../shared/theme/color";
import { tenantQuestionListStyles as styles } from "./tenantQuestionStyles";
import { PaginationBar } from "../../../../shared/components/PaginationBar";
import {
  CLIENT_LIST_PAGE_SIZE,
  formatTenantIssueDateTime,
  getTotalPages,
  slicePage,
} from "../../../../shared/utils";
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

type NavProp = NativeStackNavigationProp<RootStackParamList, "TenantQuestionList">;

const DETAIL_LINK_COLOR = "#3D8BA8";
const PAGE_SIZE = CLIENT_LIST_PAGE_SIZE;

function sortByCreatedDesc(a: IssueTicketResponseFromApi, b: IssueTicketResponseFromApi) {
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  return tb - ta;
}

/** Chỉ giữ phản hồi gắn ticket loại QUESTION trong danh sách ticket của tenant. */
function filterResponsesForQuestionTickets(
  responses: IssueTicketResponseFromApi[],
  tickets: { id: string; type: string }[]
): IssueTicketResponseFromApi[] {
  const questionIds = new Set(
    tickets
      .filter((t) => String(t.type || "").toUpperCase() === "QUESTION")
      .map((t) => t.id)
  );
  return responses.filter((r) => questionIds.has(r.ticketId));
}

const TenantQuestionListScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavProp>();

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<IssueTicketResponseFromApi>>(null);

  const [allItems, setAllItems] = useState<IssueTicketResponseFromApi[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [tickets, responses] = await Promise.all([getTenantTickets(), getIssueResponses()]);
      const merged = filterResponsesForQuestionTickets(responses, tickets);
      setAllItems([...merged].sort(sortByCreatedDesc));
      setCurrentPage(1);
    } catch {
      setError(t("tenant_question_list.load_error"));
      setAllItems([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const totalPages = useMemo(
    () => getTotalPages(allItems.length, PAGE_SIZE),
    [allItems.length]
  );

  const pagedItems = useMemo(
    () => slicePage(allItems, currentPage, PAGE_SIZE),
    [allItems, currentPage]
  );

  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const onPressDetail = (item: IssueTicketResponseFromApi) => {
    navigation.navigate("TenantQuestionDetail", { response: item });
  };

  const renderItem = ({ item }: { item: IssueTicketResponseFromApi }) => (
    <View style={styles.card}>
      <Text style={styles.contentPreview} numberOfLines={4}>
        {item.content || "—"}
      </Text>
      <View style={styles.dateRow}>
        <Icons.clock size={14} color={neutral.textMuted} />
        <Text style={styles.dateLine}>{formatTenantIssueDateTime(item.createdAt, locale)}</Text>
      </View>
      <View style={styles.cardBottomRow}>
        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={() => onPressDetail(item)}
          activeOpacity={0.65}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.detailsText}>{t("tenant_question_list.details_link")}</Text>
          <Icons.chevronForward size={16} color={DETAIL_LINK_COLOR} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const showPageHeading = !(loading && !refreshing);

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
              {t("tenant_question_list.screen_title")}
            </StackScreenTitleBadge>
          </View>
          <StackScreenTitleBarBalance />
        </View>
      </StackScreenTitleHeaderStrip>

      {showPageHeading ? (
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>{t("tenant_question_list.list_heading")}</Text>
          <Text style={styles.pageSubtitle}>{t("tenant_question_list.list_subtitle")}</Text>
        </View>
      ) : null}

      {loading && !refreshing ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={brandSecondary} />
          <Text style={styles.hint}>{t("common.loading")}</Text>
        </View>
      ) : error ? (
        <View style={[styles.centered, { flex: 1 }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(false)} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{t("common.try_again")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={pagedItems}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingBottom:
                Math.max(insets.bottom, 24) + (totalPages > 1 ? 8 : 0),
            },
            allItems.length === 0 && styles.listEmptyGrow,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={brandSecondary} />
          }
          ListEmptyComponent={<Text style={styles.empty}>{t("tenant_question_list.empty")}</Text>}
          ListFooterComponent={
            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              style={{ paddingBottom: Math.max(insets.bottom, 8) }}
            />
          }
        />
      )}
    </View>
  );
};

export default TenantQuestionListScreen;
