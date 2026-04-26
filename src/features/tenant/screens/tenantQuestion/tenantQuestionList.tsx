import React, { useCallback, useMemo, useRef, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  RootStackParamList,
  IssueTicketResponseFromApi,
} from "../../../../shared/types";
import { getIssueResponses, getTenantTickets } from "../../../../shared/services/issuesApi";
import { useTenantHouses, useRefreshControlGate } from "../../../../shared/hooks";
import {
  PullToRefreshControl,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import Icons from "../../../../shared/theme/icon";
import { neutral } from "../../../../shared/theme/color";
import { tenantQuestionListStyles as styles } from "./tenantQuestionStyles";
import { PaginationBar } from "../../../../shared/components/PaginationBar";
import {
  CLIENT_LIST_PAGE_SIZE,
  formatTenantIssueDateTime,
  getTotalPages,
  slicePage,
} from "../../../../shared/utils";
import { getIssueResponseContentForUi } from "../../../../shared/utils/issueTicketLocalizedText";
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

type QuestionTicketMeta = { id: string; type: string; houseId: string };

/** Chỉ giữ phản hồi gắn ticket loại QUESTION; trả về map ticketId → houseId (đồng bộ “khu” với ticket). */
function filterResponsesAndHouseByTicket(
  responses: IssueTicketResponseFromApi[],
  tickets: QuestionTicketMeta[]
): { merged: IssueTicketResponseFromApi[]; houseIdByTicketId: Record<string, string> } {
  const questionTickets = tickets.filter((t) => String(t.type || "").toUpperCase() === "QUESTION");
  const questionIds = new Set(questionTickets.map((t) => t.id));
  const houseIdByTicketId: Record<string, string> = {};
  for (const t of questionTickets) {
    houseIdByTicketId[t.id] = String(t.houseId ?? "").trim();
  }
  return {
    merged: responses.filter((r) => questionIds.has(r.ticketId)),
    houseIdByTicketId,
  };
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
  const { data: housesData } = useTenantHouses();
  const tenantHouseList = housesData?.data ?? [];

  const houseNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of tenantHouseList) {
      const id = String(h.id ?? "").trim();
      if (!id) continue;
      const name = String(h.name ?? "").trim();
      m.set(id, name.length ? name : id);
    }
    return m;
  }, [tenantHouseList]);

  const [allItems, setAllItems] = useState<IssueTicketResponseFromApi[]>([]);
  const [houseIdByTicketId, setHouseIdByTicketId] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [tickets, responses] = await Promise.all([getTenantTickets(), getIssueResponses()]);
      const { merged, houseIdByTicketId: houseMap } = filterResponsesAndHouseByTicket(responses, tickets);
      setAllItems([...merged].sort(sortByCreatedDesc));
      setHouseIdByTicketId(houseMap);
      setCurrentPage(1);
    } catch {
      setError(t("tenant_question_list.load_error"));
      setAllItems([]);
      setHouseIdByTicketId({});
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

  const zoneLabelForTicket = useCallback(
    (ticketId: string) => {
      const hid = houseIdByTicketId[ticketId];
      if (!hid) return t("tenant_question_list.zone_unknown");
      return houseNameById.get(hid) ?? t("tenant_question_list.zone_unknown");
    },
    [houseIdByTicketId, houseNameById, t]
  );

  const onPressDetail = useCallback(
    (item: IssueTicketResponseFromApi) => {
      navigation.navigate("TenantQuestionDetail", {
        response: item,
        zoneLabel: zoneLabelForTicket(item.ticketId),
      });
    },
    [navigation, zoneLabelForTicket]
  );

  const renderItem = useCallback(
    ({ item }: { item: IssueTicketResponseFromApi }) => (
      <View style={styles.card}>
        <View style={styles.areaBadge} accessibilityLabel={t("tenant_question_detail.field_zone")}>
          <Icons.place size={14} color={neutral.slate500} />
          <Text style={styles.areaText} numberOfLines={1}>
            {zoneLabelForTicket(item.ticketId)}
          </Text>
        </View>
        <Text style={styles.contentPreview} numberOfLines={4}>
          {getIssueResponseContentForUi(item).trim() || "—"}
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
    ),
    [locale, onPressDetail, t, zoneLabelForTicket]
  );

  const listBottomPad =
    Math.max(insets.bottom, 28) + 28 + (totalPages > 1 ? 10 : 0);

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
        <View
          style={[
            styles.centered,
            { flex: 1, paddingBottom: Math.max(insets.bottom, 20), position: "relative" },
          ]}
        >
          <RefreshLogoOverlay visible mode="page" />
        </View>
      ) : error ? (
        <View style={[styles.centered, { flex: 1, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => load(false)} activeOpacity={0.8}>
            <Text style={styles.retryBtnText}>{t("common.try_again")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1, position: "relative" }}>
          <RefreshLogoOverlay visible={refreshing} />
          <FlatList
            ref={listRef}
            style={{ flex: 1 }}
            data={pagedItems}
            keyExtractor={(it) => it.id}
            renderItem={renderItem}
            extraData={i18n.language}
            contentContainerStyle={[
              styles.listContent,
              { paddingBottom: listBottomPad },
              allItems.length === 0 && styles.listEmptyGrow,
            ]}
            onScroll={onScrollForRefreshGate}
            scrollEventThrottle={16}
            refreshControl={
              <PullToRefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                scrollAtTop={scrollAtTop}
              />
            }
          ListEmptyComponent={<Text style={styles.empty}>{t("tenant_question_list.empty")}</Text>}
            ListFooterComponent={
              <PaginationBar
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                style={{ paddingBottom: 10 }}
              />
            }
          />
        </View>
      )}
    </View>
  );
};

export default TenantQuestionListScreen;
