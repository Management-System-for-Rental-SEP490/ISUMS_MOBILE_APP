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
import { CustomAlert as Alert } from "../../../../shared/components/alert";
import { RootStackParamList, TenantTicketFromApi } from "../../../../shared/types";
import { useTenantContext } from "../../../../shared/hooks";
import { getTenantTickets } from "../../../../shared/services/issuesApi";
import { TenantTicketMenu } from "./modal/tenantTicketMenu";
import Icons from "../../../../shared/theme/icon";
import { brandSecondary, neutral } from "../../../../shared/theme/color";
import { tenantTicketListStyles as styles } from "./ticketStyles";
import { PaginationBar } from "../../../../shared/components/PaginationBar";
import {
  CLIENT_LIST_PAGE_SIZE,
  formatTenantIssueDateTime,
  getTotalPages,
  slicePage,
} from "../../../../shared/utils";
import {
  StackScreenTitleBadge,
  StackScreenTitleHeaderStrip,
  stackScreenTitleBackBtnOnBrand,
  stackScreenTitleCenterSlotStyle,
  stackScreenTitleOnBrandIconColor,
  stackScreenTitleRowStyle,
  stackScreenTitleSideSlotStyle,
} from "../../../../shared/components/StackScreenTitleBadge";

type NavProp = NativeStackNavigationProp<RootStackParamList, "TenantTicketList">;

const DETAIL_LINK_COLOR = "#3D8BA8";

function sortByCreatedDesc(a: TenantTicketFromApi, b: TenantTicketFromApi) {
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  return tb - ta;
}

const PAGE_SIZE = CLIENT_LIST_PAGE_SIZE;

const TenantTicketListScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<NavProp>();
  const { houseId } = useTenantContext();
  const [menuOpen, setMenuOpen] = useState(false);

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<TenantTicketFromApi>>(null);

  const [allItems, setAllItems] = useState<TenantTicketFromApi[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await getTenantTickets();
      setAllItems([...data].sort(sortByCreatedDesc));
      setCurrentPage(1);
    } catch {
      setError(t("tenant_ticket_list.load_error"));
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

  const statusLabel = (status: string) => {
    const key = `tenant_ticket_list.status_${String(status || "").toUpperCase()}`;
    const label = t(key);
    if (label !== key) return label;
    return status;
  };

  const statusVisual = (status: string) => {
    const s = String(status || "").toUpperCase();
    if (s === "CREATED") {
      return { pill: styles.statusCreated, dot: styles.statusCreatedDot, text: styles.statusCreatedText };
    }
    if (s === "SCHEDULED") {
      return { pill: styles.statusScheduled, dot: styles.statusScheduledDot, text: styles.statusScheduledText };
    }
    if (s === "NEED_RESCHEDULE") {
      return { pill: styles.statusScheduled, dot: styles.statusScheduledDot, text: styles.statusScheduledText };
    }
    if (s === "IN_PROGRESS") {
      return { pill: styles.statusInProgress, dot: styles.statusInProgressDot, text: styles.statusInProgressText };
    }
    if (s === "WAITING_TENANT_APPROVAL") {
      return {
        pill: styles.statusWaitingTenant,
        dot: styles.statusWaitingTenantDot,
        text: styles.statusWaitingTenantText,
      };
    }
    if (s === "WAITING_MANAGER_APPROVAL" || s === "WAITING_PAYMENT") {
      return { pill: styles.statusCreated, dot: styles.statusCreatedDot, text: styles.statusCreatedText };
    }
    if (s === "DONE") {
      return { pill: styles.statusDone, dot: styles.statusDoneDot, text: styles.statusDoneText };
    }
    if (s === "CLOSED") {
      return { pill: styles.statusDone, dot: styles.statusDoneDot, text: styles.statusDoneText };
    }
    if (s === "CANCELLED") {
      return { pill: styles.statusCancelled, dot: styles.statusCancelledDot, text: styles.statusCancelledText };
    }
    return { pill: styles.statusDefault, dot: styles.statusDefaultDot, text: styles.statusDefaultText };
  };

  const typeLabel = (type: string) => {
    const u = String(type || "").toUpperCase();
    const key = `tenant_ticket_list.type_${u}`;
    const label = t(key);
    if (label !== key) return label;
    return type;
  };

  const typeTagBg = (type: string) => {
    const u = String(type || "").toUpperCase();
    if (u === "REPAIR") return styles.typeRepair;
    if (u === "QUESTION") return styles.typeQuestion;
    return styles.typeDefault;
  };

  const typeTagFg = (type: string) => {
    const u = String(type || "").toUpperCase();
    if (u === "REPAIR") return styles.typeRepairText;
    if (u === "QUESTION") return styles.typeQuestionText;
    return styles.typeDefaultText;
  };

  const onPressDetail = (item: TenantTicketFromApi) => {
    navigation.navigate("TenantTicketDetail", { ticket: item });
  };

  const openCreateTicket = () => {
    setMenuOpen(false);
    const hid = String(houseId ?? "").trim();
    if (!hid) {
      Alert.alert(t("ticket.validation_error_title"), t("ticket.house_missing"));
      return;
    }
    navigation.navigate("Ticket", { houseId: hid });
  };

  const renderItem = ({ item }: { item: TenantTicketFromApi }) => {
    const sv = statusVisual(item.status);
    return (
      <View style={styles.card}>
        <View style={[styles.typeTag, typeTagBg(item.type)]}>
          <Text style={[styles.typeTagText, typeTagFg(item.type)]}>{typeLabel(item.type)}</Text>
        </View>
        <Text style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.dateRow}>
          <Icons.clock size={14} color={neutral.textMuted} />
          <Text style={styles.dateLine}>{formatTenantIssueDateTime(item.createdAt, locale)}</Text>
        </View>
        <View style={styles.cardBottomRow}>
          <View style={[styles.statusPill, sv.pill]}>
            <View style={[styles.statusDot, sv.dot]} />
            <Text style={[styles.statusPillText, sv.text]} numberOfLines={1}>
              {statusLabel(item.status)}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {String(item.status || "").toUpperCase() === "WAITING_PAYMENT" ? (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={() => onPressDetail(item)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.payText}>{t("tenant_ticket_list.pay_btn")}</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => onPressDetail(item)}
              activeOpacity={0.65}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.detailsText}>{t("tenant_ticket_list.details_link")}</Text>
              <Icons.chevronForward size={16} color={DETAIL_LINK_COLOR} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const showPageHeading = !(loading && !refreshing);

  return (
    <View style={styles.container}>
      <TenantTicketMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCreateTicket={openCreateTicket}
      />
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
              {t("tenant_ticket_list.screen_title")}
            </StackScreenTitleBadge>
          </View>
          <View style={stackScreenTitleSideSlotStyle}>
            <TouchableOpacity
              style={stackScreenTitleBackBtnOnBrand}
              onPress={() => setMenuOpen(true)}
              activeOpacity={0.7}
              accessibilityLabel={t("tenant_ticket_list.add_ticket_a11y")}
            >
              <Icons.plus size={22} color={stackScreenTitleOnBrandIconColor} />
            </TouchableOpacity>
          </View>
        </View>
      </StackScreenTitleHeaderStrip>

      {showPageHeading ? (
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>{t("tenant_ticket_list.list_heading")}</Text>
          <Text style={styles.pageSubtitle}>{t("tenant_ticket_list.list_subtitle")}</Text>
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
          ListEmptyComponent={
            <Text style={styles.empty}>{t("tenant_ticket_list.empty")}</Text>
          }
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

export default TenantTicketListScreen;
