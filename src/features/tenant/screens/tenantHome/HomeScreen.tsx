import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Linking,
  Animated,
  InteractionManager,
} from "react-native";
import InAppPaymentWebView from "../../../../shared/components/InAppPaymentWebView";
import { useAuthStore } from "../../../../store/useAuthStore";
import {
  createSubscriptionPaymentLink,
  fetchPlans,
  fetchSubscription,
  planDisplayName,
  type SubscriptionInfo,
  type SubscriptionPlan,
} from "../notificationPreferences/api";
import Header, { type HomeHeaderInvoiceStrip } from "../../../../shared/components/header";
import {
  HomeScreenProps,
  IssueTicketResponseFromApi,
  RootStackParamList,
} from "../../../../shared/types";
import { useTranslation } from "react-i18next";
import { getIssueResponseContentForUi } from "../../../../shared/utils/issueTicketLocalizedText";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationProp, useFocusEffect, useIsFocused } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import homeStyles, { HOME_CARD_STACK_GAP } from "./homeStyles";
import {
  TENANT_INVOICES_QUERY_KEY,
  useTenantHouses,
  useUserProfile,
  useUpdateMainHouseMutation,
  useTenantContext,
  useTenantInvoices,
  useRefreshControlGate,
  useHouseById,
} from "../../../../shared/hooks";
import {
  PullToRefreshControl,
  RefreshLogoInline,
  RefreshLogoOverlay,
} from "@shared/components/RefreshLogoOverlay";
import { useTenantIoTConnection, useTenantUsage } from "../../hooks/useTenantIoT";

import {
  brandPrimary,
  brandSecondary,
  neutral,
  waterAccent,
} from "../../../../shared/theme/color";
import type { HouseFromApi, TenantInvoiceFromApi } from "../../../../shared/types/api";
import {
  formatDayMonthNumeric,
  formatTenantIssueDateTime,
  getTenantAccessBlock,
  translateTenantAccessReason,
} from "../../../../shared/utils";
import { getIssueResponses, getTenantTickets } from "../../../../shared/services/issuesApi";
import { getHomeGreetingI18nKey } from "../../../../shared/utils/homeTimeGreeting";
import {
  isTenantInvoiceDueUrgent,
  isTenantInvoicePayable,
  tenantHouseHasUnpaidRentExcludingIssue,
} from "../../../../shared/utils/tenantInvoice";
import { CustomAlert } from "../../../../shared/components/alert";
import Icons from "../../../../shared/theme/icon";
import { tenantFooterLinks } from "../../../../shared/constants/tenantFooterLinks";
import { IotPushAlertOverlay } from "../../components/IotPushAlertOverlay";

const EMPTY_TENANT_HOUSES: HouseFromApi[] = [];
const EMPTY_TENANT_INVOICES: TenantInvoiceFromApi[] = [];

/** Khoảng cách giữa các ô tiện ích — mỗi hàng 3 ô co giãn theo chiều ngang màn hình. */
const UTILITY_GRID_GAP = 10;
const UTILITY_ICON_MIN = 13;
const UTILITY_ICON_MAX = 20;
const UTILITY_LABEL_MIN = 9;
const UTILITY_LABEL_MAX = 11;

function chunkArray<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

type HomeUtilityCellDef = {
  key: string;
  bg: string;
  label: string;
  onPress: () => void;
};

function renderHomeUtilityIcon(cellKey: string, size: number) {
  switch (cellKey) {
    case "house":
      return <Icons.home color={brandPrimary} size={size} />;
    case "profile":
      return <Icons.user color="#6D28D9" size={size} />;
    case "invoice":
      return <Icons.invoice color="#B45309" size={size} />;
    case "ticket":
      return <Icons.ticket color="#047857" size={size} />;
    case "consumption":
      return <Icons.consumption color="#0D9488" size={size} />;
    case "qa":
      return <Icons.brain color="#4F46E5" size={size} />;
    case "scan":
      return <Icons.scanLookup color={brandPrimary} size={size} />;
    case "settings":
      return <Icons.settings color={brandSecondary} size={size} />;
    case "premium":
      // Amber tone matches the FEF3C7 cell bg + #F59E0B ribbon in the
      // premium modal — visual consistency between the Home tile and the
      // PREMIUM upsell sheet so users recognise the surface immediately.
      return <Icons.premium color="#B45309" size={size} />;
    default:
      return null;
  }
}

/**
 * Số khoản từ ticket/sửa chữa cần thanh toán hiển thị trên dải header Home.
 * Luồng thanh toán ticket sẽ bổ sung sau — khi đó cộng vào tổng dải cùng hóa đơn toàn căn.
 */
const TENANT_HOME_HEADER_PAYABLE_TICKET_PLACEHOLDER = 0;

const QUESTION_TICKER_ROTATE_MS = 4500;

type QuestionTicketMeta = { id: string; type: string; houseId: string };

function filterQuestionResponsesForHome(
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

function sortIssueResponseCreatedDesc(a: IssueTicketResponseFromApi, b: IssueTicketResponseFromApi) {
  const ta = new Date(a.createdAt).getTime();
  const tb = new Date(b.createdAt).getTime();
  return tb - ta;
}

type HomeQuestionTickerCardProps = {
  items: IssueTicketResponseFromApi[];
  getZoneLabel: (ticketId: string) => string;
  onOpen: (item: IssueTicketResponseFromApi) => void;
};

function HomeQuestionTickerCard({ items, getZoneLabel, onOpen }: HomeQuestionTickerCardProps) {
  const { t, i18n } = useTranslation();
  const [idx, setIdx] = useState(0);
  const opacity = useRef(new Animated.Value(1)).current;

  const locale = useMemo(() => {
    const lang = String(i18n.language || "").toLowerCase();
    if (lang.startsWith("en")) return "en-US";
    if (lang.startsWith("ja")) return "ja-JP";
    return "vi-VN";
  }, [i18n.language]);

  useEffect(() => {
    setIdx(0);
  }, [items]);

  useEffect(() => {
    if (items.length <= 1) return;
    const id = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, QUESTION_TICKER_ROTATE_MS);
    return () => clearInterval(id);
  }, [items.length]);

  const safeIdx = items.length === 0 ? 0 : idx % items.length;
  const item = items[safeIdx];

  const tickerContent = useMemo(
    () => (item ? getIssueResponseContentForUi(item) : ""),
    [item, i18n.language]
  );

  useEffect(() => {
    if (!item) return;
    opacity.setValue(0.72);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 320,
      useNativeDriver: true,
    }).start();
  }, [item?.id, opacity]);

  if (!item) return null;

  const zone = getZoneLabel(item.ticketId);
  const dateLine = formatTenantIssueDateTime(item.createdAt, locale);

  return (
    <View style={homeStyles.questionTickerWrap}>
      <Pressable
        onPress={() => onOpen(item)}
        android_ripple={{ color: "rgba(0,0,0,0.06)" }}
        style={({ pressed }) => [
          homeStyles.questionTickerPress,
          pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${t("home.question_feedback_card_title")}. ${tickerContent}. ${zone}. ${t("home.question_ticker_a11y")}`}
      >
        <View style={homeStyles.questionTickerIconCircle}>
          <Icons.brain color="#4F46E5" size={20} />
        </View>
        <View style={homeStyles.questionTickerBody}>
          <Animated.View style={{ opacity }}>
            <Text style={homeStyles.questionTickerText} numberOfLines={2} ellipsizeMode="tail">
              {tickerContent.trim() || "—"}
            </Text>
            <Text style={homeStyles.questionTickerMeta} numberOfLines={1}>
              {zone} · {dateLine}
            </Text>
          </Animated.View>
        </View>
        <View style={homeStyles.questionTickerChevron}>
          <Icons.chevronForward size={18} color="#4F46E5" />
        </View>
      </Pressable>
      {items.length > 1 ? (
        <View style={homeStyles.questionTickerDots}>
          {items.map((dotItem, i) => (
            <View
              key={dotItem.id}
              style={[
                homeStyles.questionTickerDot,
                i === safeIdx ? homeStyles.questionTickerDotActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const HomeScreen = ({ navigation }: HomeScreenProps) => {
  const queryClient = useQueryClient();
  const { houseId, setHouseId } = useAuthStore();
  const { t, i18n } = useTranslation();
  const homeTabFocused = useIsFocused();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  /** Home là màn `Main` trên root stack — dùng stack này; trước đây qua tab nên cần getParent. */
  const rootNavigation = useMemo(
    () => navigation.getParent<NavigationProp<RootStackParamList>>() ?? navigation,
    [navigation]
  );
  const [houseModalVisible, setHouseModalVisible] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const [premiumPlanLoading, setPremiumPlanLoading] = useState<string | null>(null);
  const [premiumPlans, setPremiumPlans] = useState<SubscriptionPlan[]>([]);
  const [premiumPlansLoading, setPremiumPlansLoading] = useState(false);
  // In-app VNPay session — null when no payment is in flight. We render the
  // overlay with a controlled URL so back-navigation, OTP retries, etc. all
  // happen inside the app shell (no system browser, no exposed URL bar).
  const [paymentWebViewUrl, setPaymentWebViewUrl] = useState<string | null>(null);

  // PREMIUM subscription state for Home — drives the badge in the header
  // strip + the "Mua gói"/"Gia hạn" cell label. Stale-while-revalidate so
  // the user sees their last-known tier instantly on cold-open while the
  // network call refreshes in the background.
  // useFocusEffect bên dưới đã invalidate query này mỗi lần Home focus →
  // không cần refetchOnMount:"always" (tránh double-fetch khi mount).
  // staleTime 2 phút: tab-switch nhanh dùng cache, vẫn fresh sau mỗi lần focus.
  const subscriptionQuery = useQuery<SubscriptionInfo>({
    queryKey: ["notif", "subscription", houseId],
    queryFn: () => fetchSubscription(houseId as string),
    enabled: !!houseId,
    staleTime: 1000 * 60 * 2,
  });
  const isPremium =
    !!houseId &&
    subscriptionQuery.data?.tier === "PREMIUM" &&
    subscriptionQuery.data?.houseId === houseId;
  const premiumUntilLabel = useMemo(() => {
    const u = subscriptionQuery.data?.premiumUntil;
    if (!u) return null;
    try {
      const d = new Date(u);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yy = d.getFullYear();
      return `${dd}/${mm}/${yy}`;
    } catch {
      return null;
    }
  }, [subscriptionQuery.data?.premiumUntil]);
  const autoSetMainHouseRef = useRef<string>("");
  const [isSubmittingMainHouse, setIsSubmittingMainHouse] = useState(false);
  const [pendingMainHouseId, setPendingMainHouseId] = useState<string | null>(null);
  const updateMainHouseMutation = useUpdateMainHouseMutation();
  const mutateMainHouse = updateMainHouseMutation.mutate;
  const mutateMainHouseAsync = updateMainHouseMutation.mutateAsync;

  const {
    data: housesData,
    isLoading: loadingHouses,
    refetch: refetchHouses,
  } = useTenantHouses();
  const tenantHouses: HouseFromApi[] = useMemo(
    () => housesData?.data ?? EMPTY_TENANT_HOUSES,
    [housesData?.data]
  );
  const { data: userProfile, isPending: profilePending } = useUserProfile();
  const profileMainHouseId = String(userProfile?.mainHouseId ?? "").trim();
  const hasPersistedMainHouse = useMemo(
    () =>
      profileMainHouseId.length > 0 &&
      tenantHouses.some((h) => h.id === profileMainHouseId),
    [profileMainHouseId, tenantHouses]
  );

  useEffect(() => {
    if (loadingHouses || tenantHouses.length === 0) return;
    if (houseId && !tenantHouses.some((h) => h.id === houseId)) {
      setHouseId(null);
    }
  }, [loadingHouses, tenantHouses, houseId, setHouseId]);

  useEffect(() => {
    if (loadingHouses) return;
    if (tenantHouses.length !== 1) return;
    const only = tenantHouses[0]!;
    if (houseId !== only.id) setHouseId(only.id);
    if (autoSetMainHouseRef.current === only.id) return;
    autoSetMainHouseRef.current = only.id;
    mutateMainHouse({ houseId: only.id });
  }, [loadingHouses, tenantHouses, houseId, setHouseId, mutateMainHouse]);

  useEffect(() => {
    if (loadingHouses || tenantHouses.length <= 1) return;
    const hasValidSelectedHouse =
      Boolean(houseId) && tenantHouses.some((h) => h.id === houseId);
    const mainFromProfile = String(userProfile?.mainHouseId ?? "").trim();
    if (mainFromProfile && tenantHouses.some((h) => h.id === mainFromProfile)) {
      if (!hasValidSelectedHouse) setHouseId(mainFromProfile);
      setHouseModalVisible(false);
      return;
    }
    if (hasValidSelectedHouse) {
      setHouseModalVisible(false);
      return;
    }
    setHouseModalVisible(true);
  }, [
    loadingHouses,
    tenantHouses,
    houseId,
    setHouseId,
    profilePending,
    userProfile?.mainHouseId,
  ]);

  const { house: myHouse, houseId: contextHouseId, thingId } = useTenantContext();
  const hasTenantHouse = Boolean(myHouse);

  const iotConnected = useTenantIoTConnection(thingId);
  const electricUsage = useTenantUsage({
    houseId: contextHouseId,
    metric: "electricity",
  });
  const waterUsage = useTenantUsage({
    houseId: contextHouseId,
    metric: "water",
  });

  const accessReasonText = useMemo(
    () => translateTenantAccessReason(myHouse?.accessReason, myHouse?.accessStatus, t),
    [myHouse?.accessReason, myHouse?.accessStatus, t]
  );

  const openPaymentScreen = useCallback(() => {
    rootNavigation.navigate("TenantInvoiceList");
  }, [rootNavigation]);

  const effectiveHouseId = useMemo(
    () => String(houseId ?? myHouse?.id ?? "").trim(),
    [houseId, myHouse?.id]
  );
  const { data: homeHouseDetailRes } = useHouseById(effectiveHouseId, Boolean(effectiveHouseId));
  const localizedHomeHouse = useMemo<HouseFromApi | null>(() => {
    if (!myHouse) return null;
    const detail = homeHouseDetailRes?.success ? homeHouseDetailRes.data : null;
    if (!detail) return myHouse;
    return {
      ...myHouse,
      ...detail,
      accessStatus: myHouse.accessStatus ?? detail.accessStatus,
      accessReason: myHouse.accessReason ?? detail.accessReason,
      hasUnpaidInvoice: myHouse.hasUnpaidInvoice ?? detail.hasUnpaidInvoice,
      pendingInvoiceId: myHouse.pendingInvoiceId ?? detail.pendingInvoiceId,
      memberRole: myHouse.memberRole ?? detail.memberRole,
      contractDocuments: myHouse.contractDocuments ?? detail.contractDocuments,
    };
  }, [homeHouseDetailRes, myHouse]);
  const hasAnyTenantHouse = tenantHouses.length > 0;
  /** Hóa đơn API trả về theo tenant — bật khi đã có danh sách căn (kể cả chưa chọn căn hiển thị). */
  const invoiceQueryEnabled = hasAnyTenantHouse && !loadingHouses;
  const {
    data: invoiceListRaw,
    isLoading: invoicesLoading,
    refetch: refetchInvoices,
  } = useTenantInvoices(invoiceQueryEnabled, { focused: homeTabFocused });
  const invoiceList = invoiceListRaw ?? EMPTY_TENANT_INVOICES;

  const accessBlock = useMemo(() => {
    if (loadingHouses || !myHouse) return null;
    return getTenantAccessBlock(myHouse, invoiceList);
  }, [loadingHouses, myHouse, invoiceList]);

  const accessStatusUpper = useMemo(
    () => (myHouse?.accessStatus ?? "").trim().toUpperCase(),
    [myHouse?.accessStatus]
  );
  const pendingFirstRentByStatus = accessStatusUpper === "PENDING_FIRST_RENT";

  const hasUnpaidRentForBanner = useMemo(() => {
    if (!myHouse || !invoiceQueryEnabled || invoicesLoading) return false;
    return tenantHouseHasUnpaidRentExcludingIssue(
      invoiceList,
      String(myHouse.id ?? "").trim()
    );
  }, [myHouse, invoiceQueryEnabled, invoicesLoading, invoiceList]);

  const showRentPaymentBanner = Boolean(
    myHouse && (pendingFirstRentByStatus || hasUnpaidRentForBanner)
  );

  /** Một dòng nhắc trên Home (không che nội dung). */
  const accessReminderLine = useMemo(() => {
    if (!accessBlock || !myHouse) return "";
    if (accessBlock === "handover") {
      return (
        accessReasonText ||
        t("home.access.handover_body", {
          date: myHouse.handoverDate
            ? formatDayMonthNumeric(new Date(myHouse.handoverDate), i18n.language)
            : "—",
        })
      );
    }
    if (accessBlock === "deposit") {
      return accessReasonText || t("home.access.deposit_body");
    }
    if (accessBlock === "payment_restricted") {
      return accessReasonText || t("home.access.payment_restricted_banner");
    }
    return "";
  }, [accessBlock, myHouse, accessReasonText, t, i18n.language]);

  /** Banner thanh toán tiền nhà (PENDING_FIRST_RENT hoặc còn hóa đơn thuê/cọc chưa trả, không tính ISSUE). */
  const rentPaymentBannerLine = useMemo(() => {
    if (!myHouse || !showRentPaymentBanner) return "";
    if (pendingFirstRentByStatus) {
      return accessReasonText || t("home.access.payment_banner");
    }
    return t("home.access.payment_banner");
  }, [
    myHouse,
    showRentPaymentBanner,
    pendingFirstRentByStatus,
    accessReasonText,
    t,
  ]);

  /**
   * Giống banner nhắc thanh toán: PENDING_FIRST_RENT / còn hóa đơn thuê-cọc chưa trả không được coi là “đủ quyền”
   * cho nhóm nút mở rộng (ticket, tiêu thụ, Q&A, quét). Trước đây chỉ gắn `accessBlock` nên các trạng thái này
   * vẫn mở hết thao tác nhanh dù đã hiện banner.
   */
  const showFullHomeFeatures = !accessBlock && !showRentPaymentBanner;

  const [questionTickerItems, setQuestionTickerItems] = useState<IssueTicketResponseFromApi[]>([]);
  const [questionHouseByTicketId, setQuestionHouseByTicketId] = useState<Record<string, string>>(
    {}
  );

  const houseNameByIdForQuestions = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of tenantHouses) {
      const id = String(h.id ?? "").trim();
      if (!id) continue;
      const name = String(h.name ?? "").trim();
      m.set(id, name.length ? name : id);
    }
    if (localizedHomeHouse?.id) {
      const name = String(localizedHomeHouse.name ?? "").trim();
      if (name) m.set(localizedHomeHouse.id, name);
    }
    return m;
  }, [tenantHouses, localizedHomeHouse]);

  const loadQuestionTicker = useCallback(async () => {
    if (!hasAnyTenantHouse) return;
    try {
      const [tickets, responses] = await Promise.all([getTenantTickets(), getIssueResponses()]);
      const { merged, houseIdByTicketId } = filterQuestionResponsesForHome(responses, tickets);
      setQuestionTickerItems([...merged].sort(sortIssueResponseCreatedDesc));
      setQuestionHouseByTicketId(houseIdByTicketId);
    } catch {
      setQuestionTickerItems([]);
      setQuestionHouseByTicketId({});
    }
  }, [hasAnyTenantHouse, i18n.language]);

  /**
   * useFocusEffect duy nhất xử lý cả mount và focus-back:
   * - Subscription invalidate: chạy ngay (không defer) để badge header cập nhật tier nhanh nhất.
   * - Question ticker: defer qua InteractionManager — không cạnh tranh băng thông
   *   với các query chính (useUserProfile, useTenantHouses, useTenantInvoices…) khi first paint.
   *   useEffect riêng cho loadQuestionTicker đã bị gỡ vì useFocusEffect đã bao phủ cả mount.
   */
  useFocusEffect(
    useCallback(() => {
      // Coming back from the VNPay WebView (or a deep-link payment return)
      // we need fresh tier — invalidate so the badge in the header strip
      // flips to PREMIUM as soon as the BE Kafka listener has processed
      // the subscription-activated event.
      queryClient.invalidateQueries({ queryKey: ["notif", "subscription"] });

      const task = InteractionManager.runAfterInteractions(() => {
        void loadQuestionTicker();
      });
      return () => task.cancel();
    }, [loadQuestionTicker, queryClient])
  );

  const zoneLabelForQuestionTicket = useCallback(
    (ticketId: string) => {
      const hid = questionHouseByTicketId[ticketId];
      if (!hid) return t("tenant_question_list.zone_unknown");
      return houseNameByIdForQuestions.get(hid) ?? t("tenant_question_list.zone_unknown");
    },
    [questionHouseByTicketId, houseNameByIdForQuestions, t]
  );

  const openQuestionDetailFromTicker = useCallback(
    (r: IssueTicketResponseFromApi) => {
      rootNavigation.navigate("TenantQuestionDetail", {
        response: r,
        zoneLabel: zoneLabelForQuestionTicket(r.ticketId),
      });
    },
    [rootNavigation, zoneLabelForQuestionTicket]
  );

  /**
   * Hóa đơn cần thanh toán dùng cho dải header — đồng bộ với trang danh sách hóa đơn.
   * Không lọc theo căn (tenantHouses) vì danh sách hóa đơn cũng hiển thị toàn bộ;
   * lọc houseId trước đây gây mâu thuẫn: hóa đơn UNPAID có houseId không nằm trong
   * my-access vẫn xuất hiện trên list nhưng Home đếm = 0 → "Không có hóa đơn cần thanh toán".
   */
  const headerPayableInvoices = useMemo(
    () => invoiceList.filter((inv) => isTenantInvoicePayable(inv.status)),
    [invoiceList]
  );

  const headerPayableCount = useMemo(
    () => headerPayableInvoices.length + TENANT_HOME_HEADER_PAYABLE_TICKET_PLACEHOLDER,
    [headerPayableInvoices.length]
  );

  const loading = loadingHouses;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const { scrollAtTop, onScrollForRefreshGate } = useRefreshControlGate();

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchHouses(),
        ...(invoiceQueryEnabled ? [refetchInvoices()] : []),
        ...(contextHouseId ? [electricUsage.refetch(), waterUsage.refetch()] : []),
        loadQuestionTicker(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchHouses,
    refetchInvoices,
    invoiceQueryEnabled,
    contextHouseId,
    electricUsage.refetch,
    waterUsage.refetch,
    loadQuestionTicker,
  ]);


  const handleSelectMainHouse = useCallback(
    async (selectedHouseId: string) => {
      if (!selectedHouseId || isSubmittingMainHouse) return;
      if (hasPersistedMainHouse) {
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        await queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY });
        return;
      }
      try {
        setIsSubmittingMainHouse(true);
        setPendingMainHouseId(selectedHouseId);
        await mutateMainHouseAsync({ houseId: selectedHouseId });
        setHouseId(selectedHouseId);
        setHouseModalVisible(false);
        await queryClient.invalidateQueries({ queryKey: TENANT_INVOICES_QUERY_KEY });
        await refetchHouses();
      } catch {
        CustomAlert.alert(
          t("home.main_house_update_failed_title"),
          t("home.main_house_update_failed_message"),
          [{ text: t("common.close"), style: "default" }],
          { type: "error" }
        );
      } finally {
        setIsSubmittingMainHouse(false);
        setPendingMainHouseId(null);
      }
    },
    [
      isSubmittingMainHouse,
      hasPersistedMainHouse,
      queryClient,
      refetchHouses,
      setHouseId,
      tenantHouses,
      t,
      mutateMainHouseAsync,
    ]
  );

  const displayWelcomeName = useMemo(() => {
    const raw = String(userProfile?.name ?? "").trim();
    return raw.length > 0 ? raw : t("home.hero_fallback_name");
  }, [userProfile?.name, t]);

  const homeHeaderWelcome = useMemo(() => {
    const greetingKey = getHomeGreetingI18nKey();
    return {
      helloLine: t(greetingKey, { name: displayWelcomeName }),
    };
  }, [t, displayWelcomeName]);

  const navigateToProfileFromHeader = useCallback(() => {
    rootNavigation.navigate("ProfileScreen");
  }, [rootNavigation]);

  const navigateToInvoicesFromHeader = useCallback(() => {
    rootNavigation.navigate("TenantInvoiceList");
  }, [rootNavigation]);

  const navigateToCurrentHouseDetail = useCallback(() => {
    const houseForDetail = localizedHomeHouse ?? myHouse;
    if (!houseForDetail) return;
    rootNavigation.navigate("BuildingDetail", {
      buildingId: houseForDetail.id,
      buildingName: houseForDetail.name,
      buildingAddress: houseForDetail.address,
      description: houseForDetail.description,
      ward: houseForDetail.ward,
      commune: houseForDetail.commune,
      city: houseForDetail.city,
      status: houseForDetail.status,
      functionalAreas: houseForDetail.functionalAreas ?? [],
      contractDocuments: houseForDetail.contractDocuments,
      hasUnpaidInvoice: houseForDetail.hasUnpaidInvoice,
      pendingInvoiceId: houseForDetail.pendingInvoiceId ?? null,
      accessStatus: houseForDetail.accessStatus,
      accessReason: houseForDetail.accessReason ?? null,
      memberRole: houseForDetail.memberRole,
    });
  }, [localizedHomeHouse, myHouse, rootNavigation]);

  const homeInvoiceStrip = useMemo((): HomeHeaderInvoiceStrip => {
    if (!hasAnyTenantHouse) return { kind: "hidden" };
    if (invoiceQueryEnabled && invoicesLoading && invoiceList.length === 0) {
      return { kind: "loading" };
    }
    const n = headerPayableCount;
    if (n === 0) {
      return { kind: "all_paid" };
    }
    const urgent = headerPayableInvoices.some((inv) => isTenantInvoiceDueUrgent(inv));
    return { kind: "payable", count: n, urgent };
  }, [
    hasAnyTenantHouse,
    headerPayableCount,
    headerPayableInvoices,
    invoiceQueryEnabled,
    invoicesLoading,
    invoiceList.length,
  ]);

  const utilityIconSize = useMemo(() => {
    const s = Math.round(11 + windowWidth * 0.017);
    return Math.max(UTILITY_ICON_MIN, Math.min(UTILITY_ICON_MAX, s));
  }, [windowWidth]);

  const utilityLabelFontSize = useMemo(() => {
    const s = Math.round(8.5 + windowWidth * 0.0035);
    return Math.max(UTILITY_LABEL_MIN, Math.min(UTILITY_LABEL_MAX, s));
  }, [windowWidth]);

  const utilityLabelDynamicStyle = useMemo(
    () => ({
      fontSize: utilityLabelFontSize,
      lineHeight: Math.round(utilityLabelFontSize * 1.35),
    }),
    [utilityLabelFontSize]
  );

  const homeUtilityCells = useMemo((): HomeUtilityCellDef[] => {
    const cells: HomeUtilityCellDef[] = [
      {
        key: "house",
        bg: "#DBEAFE",
        label: t("home.utility_house"),
        onPress: navigateToCurrentHouseDetail,
      },
      {
        key: "profile",
        bg: "#F5F0EB",
        label: t("home.utility_profile"),
        onPress: () => {
          rootNavigation.navigate("ProfileScreen");
        },
      },
      {
        key: "invoice",
        bg: "#FEF3C7",
        label: t("home.utility_invoice"),
        onPress: () => {
          rootNavigation.navigate("TenantInvoiceList");
        },
      },
      {
        key: "settings",
        bg: "#E0F2FE",
        label: t("home.utility_settings"),
        onPress: () => {
          rootNavigation.navigate("SettingsScreen");
        },
      },
    ];
    if (showFullHomeFeatures) {
      cells.push(
        {
          key: "ticket",
          bg: "#D1FAE5",
          label: t("home.utility_ticket"),
          onPress: () => {
            rootNavigation.navigate("TenantTicketList");
          },
        },
        {
          key: "consumption",
          bg: "#CCFBF1",
          label: t("home.utility_consumption"),
          onPress: () => {
            rootNavigation.navigate("ConsumptionScreen", { initialTab: "electric" });
          },
        },
        {
          key: "qa",
          bg: "#EDE9FE",
          label: t("home.utility_qa"),
          onPress: () => {
            rootNavigation.navigate("TenantQuestionList");
          },
        },
        {
          key: "scan",
          bg: "#D6D3D1",
          label: t("home.utility_scan"),
          onPress: () => {
            rootNavigation.navigate("Camera");
          },
        },
        {
          key: "premium",
          // Amber tone signals "premium / upsell" — different palette
          // from the navigation cells so it stands out as a paid action.
          // When already PREMIUM the cell pivots from "buy" → "renew/extend",
          // keeping the same modal but with a softer label so it doesn't
          // pressure an already-paying user.
          bg: "#FEF3C7",
          label: isPremium
            ? t("home.utility_premium_renew", "Gia hạn")
            : t("home.utility_premium", "Mua gói"),
          onPress: async () => {
            setPremiumModalOpen(true);
            // Refresh on every open — landlord may have edited prices
            // mid-session, and mobile state cache would otherwise show a
            // stale figure that the BE then "corrects" at checkout (BE is
            // source of truth on amount, so a stale display flashes one
            // price and charges another). Cheap fetch, small payload.
            if (premiumPlansLoading) return;
            setPremiumPlansLoading(true);
            try {
              const plans = await fetchPlans();
              setPremiumPlans(plans);
              if (plans.length === 0) {
                // eslint-disable-next-line no-console
                console.warn("[Premium] BE returned 0 plans — empty catalogue?");
              }
            } catch (e: any) {
              CustomAlert.alert(
                t("common.error", "Lỗi"),
                e?.message ?? t("home.premium_load_failed", "Không tải được danh sách gói."),
                [{ text: t("common.close", "Đóng") }],
                { type: "error" }
              );
            } finally {
              setPremiumPlansLoading(false);
            }
          },
        }
      );
    }
    return cells;
  }, [t, navigateToCurrentHouseDetail, rootNavigation, showFullHomeFeatures, isPremium, premiumPlans.length, premiumPlansLoading]);

  const formatUsageVal = useCallback((val: number, unit: string) => {
    const digits = unit === "kWh" ? 2 : 1;
    return `${val.toFixed(digits)} ${unit}`;
  }, []);

  const openTenantFooterUrl = useCallback((url: string) => {
    const u = url.trim();
    if (!u) return;
    Linking.openURL(u).catch(() => {});
  }, []);

  const renderHomeScrollContent = () => {
    if (!hasTenantHouse && !loadingHouses) {
      return null;
    }

    return (
      <View>
        {/* PREMIUM tier banner — short pill that confirms the subscription
            so the user sees the result of their purchase right on Home.
            Tap → NotifPrefs (full subscription detail). Hidden on FREE so
            the upsell is driven exclusively by the "Mua gói" cell below. */}
        {isPremium ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => rootNavigation.navigate("NotificationPreferencesScreen")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFBEB",
              borderWidth: 1,
              borderColor: "#F59E0B",
              borderRadius: 14,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginHorizontal: 16,
              marginTop: 12,
              gap: 10,
              shadowColor: "#F59E0B",
              shadowOpacity: 0.12,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 1,
            }}
            accessibilityRole="button"
            accessibilityLabel={t(
              "home.premium_badge_a11y",
              "Bạn đang dùng gói PREMIUM. Bấm để xem chi tiết."
            )}
          >
            <View
              style={{
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: "#F59E0B",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Icons.premium color="#fff" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: "800", color: "#92400E" }}>
                {t("home.premium_badge_title", "PREMIUM đang hoạt động")}
              </Text>
              {premiumUntilLabel ? (
                <Text style={{ fontSize: 11, color: "#B45309", marginTop: 2 }}>
                  {t("home.premium_badge_expires", "Hết hạn {{date}}", { date: premiumUntilLabel })}
                </Text>
              ) : null}
            </View>
            <Text style={{ fontSize: 18, color: "#F59E0B", fontWeight: "300" }}>›</Text>
          </TouchableOpacity>
        ) : null}

        {accessBlock && accessReminderLine ? (
          <View
            style={homeStyles.accessReminderBanner}
            accessibilityRole={accessBlock === "payment_restricted" ? "none" : "text"}
            accessibilityLabel={accessReminderLine}
          >
            <Text
              style={homeStyles.accessReminderBannerText}
              numberOfLines={accessBlock === "payment_restricted" ? 3 : 2}
              ellipsizeMode="tail"
            >
              {accessReminderLine}
            </Text>
            {accessBlock === "payment_restricted" ? (
              <TouchableOpacity
                style={homeStyles.accessReminderPayNowBtn}
                onPress={openPaymentScreen}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={t("home.access.pay_now")}
              >
                <Text style={homeStyles.accessReminderPayNowBtnText}>
                  {t("home.access.pay_now")}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {!accessBlock && showRentPaymentBanner && rentPaymentBannerLine ? (
          <View
            style={homeStyles.accessReminderBanner}
            accessibilityRole="text"
            accessibilityLabel={rentPaymentBannerLine}
          >
            <Text
              style={homeStyles.accessReminderBannerText}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {rentPaymentBannerLine}
            </Text>
            <TouchableOpacity
              style={homeStyles.accessReminderPayNowBtn}
              onPress={openPaymentScreen}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={t("home.banner_pay_now")}
            >
              <Text style={homeStyles.accessReminderPayNowBtnText}>
                {t("home.banner_pay_now")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {localizedHomeHouse ? (
          <Pressable
            style={({ pressed }) => [
              homeStyles.currentHouseSection,
              pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
            ]}
            onPress={navigateToCurrentHouseDetail}
            android_ripple={{ color: "rgba(0,0,0,0.06)" }}
            accessibilityRole="button"
            accessibilityLabel={`${t("home.staying_at_house_label")}, ${localizedHomeHouse.name}`}
          >
            <View style={homeStyles.currentHouseRow}>
              <View style={homeStyles.currentHouseTextBlock}>
                <Text style={homeStyles.currentHouseEyebrow}>
                  {t("home.staying_at_house_label")}
                </Text>
                <Text style={homeStyles.currentHouseName} numberOfLines={2}>
                  {localizedHomeHouse.name}
                </Text>
              </View>
              {tenantHouses.length > 1 ? (
                <Pressable
                  style={homeStyles.switchHousePill}
                  onPress={() => setHouseModalVisible(true)}
                  android_ripple={{ color: "rgba(0,0,0,0.08)" }}
                >
                  <Text style={homeStyles.switchHousePillText}>{t("home.switch_house")}</Text>
                  <Icons.chevronForward size={16} color={brandSecondary} />
                </Pressable>
              ) : null}
            </View>
          </Pressable>
        ) : null}

        <View
          style={[
            homeStyles.utilitySection,
            !myHouse ? { marginTop: HOME_CARD_STACK_GAP } : null,
          ]}
        >
          <Text style={homeStyles.utilitySectionTitle}>{t("home.utilities_title")}</Text>
          <View style={[homeStyles.utilityGridColumn, { gap: UTILITY_GRID_GAP }]}>
            {chunkArray(homeUtilityCells, 3).map((row, rowIndex) => {
              const slots: (HomeUtilityCellDef | null)[] = [
                ...row,
                ...Array.from({ length: 3 - row.length }, () => null),
              ];
              return (
                <View
                  key={`utility-row-${rowIndex}`}
                  style={[homeStyles.utilityRow, { gap: UTILITY_GRID_GAP }]}
                >
                  {slots.map((cell, slotIndex) => (
                    <View
                      key={cell?.key ?? `utility-slot-${rowIndex}-${slotIndex}`}
                      style={homeStyles.utilityCellSlot}
                    >
                      {cell ? (
                        <Pressable
                          style={({ pressed }) => [
                            homeStyles.utilityItem,
                            { backgroundColor: cell.bg },
                            pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                          ]}
                          android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                          onPress={cell.onPress}
                        >
                          <View style={homeStyles.utilityIconSlot}>
                            {renderHomeUtilityIcon(cell.key, utilityIconSize)}
                          </View>
                          <Text style={[homeStyles.utilityLabel, utilityLabelDynamicStyle]}>
                            {cell.label}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        </View>

        {hasAnyTenantHouse && questionTickerItems.length > 0 ? (
          <View style={homeStyles.questionFeedbackSection}>
            <Text style={homeStyles.questionFeedbackSectionTitle}>
              {t("home.question_feedback_card_title")}
            </Text>
            <HomeQuestionTickerCard
              items={questionTickerItems}
              getZoneLabel={zoneLabelForQuestionTicket}
              onOpen={openQuestionDetailFromTicker}
            />
          </View>
        ) : null}

        {showFullHomeFeatures && myHouse ? (
              <View style={homeStyles.usageSummarySection}>
                <View style={homeStyles.usageSummaryHeader}>
                  <Text style={homeStyles.usageSummaryTitle}>
                    {t("consumption.summary_title")}
                  </Text>
                  <View style={homeStyles.usageSummaryLiveRow}>
                    <View
                      style={[
                        homeStyles.usageSummaryLiveDot,
                        {
                          backgroundColor: iotConnected
                            ? brandPrimary
                            : neutral.textMuted,
                        },
                      ]}
                    />
                    <Text
                      style={[
                        homeStyles.usageSummaryLiveText,
                        {
                          color: iotConnected ? brandSecondary : neutral.textSecondary,
                        },
                      ]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {iotConnected ? t("consumption.iot_live") : t("consumption.iot_offline")}
                    </Text>
                  </View>
                </View>

                <View style={homeStyles.usageSummaryCards}>
                  <View
                    style={[
                      homeStyles.usageSummaryCardWrap,
                      homeStyles.usageSummaryCardWrapFirst,
                    ]}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        homeStyles.usageSummaryCard,
                        { borderLeftColor: brandPrimary },
                        pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                      ]}
                      onPress={() =>
                        rootNavigation.navigate("ConsumptionScreen", { initialTab: "electric" })
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                      <Text style={homeStyles.usageSummaryCardTitle}>
                        {t("consumption.electric_summary")}
                      </Text>
                      {electricUsage.loading ? (
                        <View style={{ marginVertical: 8, alignItems: "flex-start" }}>
                          <RefreshLogoInline logoPx={18} />
                        </View>
                      ) : (
                        <>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_day")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(electricUsage.dayVal, electricUsage.unit)}
                            </Text>
                          </Text>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_week")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(electricUsage.weekVal, electricUsage.unit)}
                            </Text>
                          </Text>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_month")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(electricUsage.monthVal, electricUsage.unit)}
                            </Text>
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  <View
                    style={[
                      homeStyles.usageSummaryCardWrap,
                      homeStyles.usageSummaryCardWrapSecond,
                    ]}
                  >
                    <Pressable
                      style={({ pressed }) => [
                        homeStyles.usageSummaryCard,
                        { borderLeftColor: waterAccent },
                        pressed && Platform.OS === "ios" ? { opacity: 0.92 } : null,
                      ]}
                      onPress={() =>
                        rootNavigation.navigate("ConsumptionScreen", { initialTab: "water" })
                      }
                      android_ripple={{ color: "rgba(0,0,0,0.06)" }}
                    >
                      <Text style={homeStyles.usageSummaryCardTitle}>
                        {t("consumption.water_summary")}
                      </Text>
                      {waterUsage.loading ? (
                        <View style={{ marginVertical: 8, alignItems: "flex-start" }}>
                          <RefreshLogoInline logoPx={18} />
                        </View>
                      ) : (
                        <>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_day")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(waterUsage.dayVal, waterUsage.unit)}
                            </Text>
                          </Text>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_week")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(waterUsage.weekVal, waterUsage.unit)}
                            </Text>
                          </Text>
                          <Text style={homeStyles.usageSummaryCardRow}>
                            {t("consumption.period_month")}:{" "}
                            <Text style={homeStyles.usageSummaryCardMonth}>
                              {formatUsageVal(waterUsage.monthVal, waterUsage.unit)}
                            </Text>
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}


        <View
          style={homeStyles.homeSiteFooter}
          accessibilityLabel={t("home.footer.aria_label")}
        >
          <Text style={homeStyles.homeSiteFooterSupport}>{t("home.footer.support_line")}</Text>
          <View style={homeStyles.homeSiteFooterLinksRow}>
            {tenantFooterLinks.privacyPolicy.trim() ? (
              <Pressable
                onPress={() => openTenantFooterUrl(tenantFooterLinks.privacyPolicy)}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text style={homeStyles.homeSiteFooterLink}>{t("home.footer.link_privacy")}</Text>
              </Pressable>
            ) : (
              <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_privacy")}</Text>
            )}
            <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_sep")}</Text>
            {tenantFooterLinks.termsOfUse.trim() ? (
              <Pressable
                onPress={() => openTenantFooterUrl(tenantFooterLinks.termsOfUse)}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text style={homeStyles.homeSiteFooterLink}>{t("home.footer.link_terms")}</Text>
              </Pressable>
            ) : (
              <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_terms")}</Text>
            )}
            <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_sep")}</Text>
            {tenantFooterLinks.support.trim() ? (
              <Pressable
                onPress={() => openTenantFooterUrl(tenantFooterLinks.support)}
                android_ripple={{ color: "rgba(0,0,0,0.06)" }}
              >
                <Text style={homeStyles.homeSiteFooterLink}>{t("home.footer.link_support")}</Text>
              </Pressable>
            ) : (
              <Text style={homeStyles.homeSiteFooterLinkMuted}>{t("home.footer.link_support")}</Text>
            )}
          </View>
          <Text style={homeStyles.homeSiteFooterCopy}>{t("home.footer.copyright")}</Text>
          <View style={homeStyles.homeSiteFooterVersionRow}>
            <View style={homeStyles.homeSiteFooterPill}>
              <Text style={homeStyles.homeSiteFooterPillText}>{t("home.footer.badge")}</Text>
            </View>
            <View style={homeStyles.homeSiteFooterDot} />
            <Text style={homeStyles.homeSiteFooterBuild}>{t("home.footer.build")}</Text>
          </View>
        </View>
      </View>
    );
  };

  if (!loadingHouses && tenantHouses.length === 0) {
    return (
      <View style={homeStyles.container}>
        <Header variant="default" onBrandPress={navigateToProfileFromHeader} />
        <View style={{ flex: 1, position: "relative" }}>
          <RefreshLogoOverlay visible={isRefreshing || loading} />
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              homeStyles.accessGateEmptyWrap,
              { paddingBottom: 24 + insets.bottom },
            ]}
            onScroll={onScrollForRefreshGate}
            scrollEventThrottle={16}
            refreshControl={
              <PullToRefreshControl
                refreshing={isRefreshing || loading}
                onRefresh={onRefresh}
                scrollAtTop={scrollAtTop}
              />
            }
          >
            <Text style={homeStyles.accessGateEmptyText}>{t("home.access.no_house")}</Text>
          </ScrollView>
        </View>
        <IotPushAlertOverlay />
      </View>
    );
  }

  return (
    <View style={homeStyles.container}>
      <Header
        variant="default"
        showNotification={showFullHomeFeatures}
        homeWelcome={homeHeaderWelcome}
        onHomeWelcomeNamePress={navigateToProfileFromHeader}
        homeInvoiceStrip={homeInvoiceStrip}
        onHomeInvoicePress={navigateToInvoicesFromHeader}
      />

      {loading && !housesData ? (
        <View style={[homeStyles.loadingContainer, { position: "relative" }]}>
          <RefreshLogoOverlay visible mode="page" labelKey="home.loading_data" />
        </View>
      ) : (
        <View style={{ flex: 1, position: "relative" }}>
          <RefreshLogoOverlay visible={isRefreshing || loading} />
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              homeStyles.deviceListContent,
              {
                paddingBottom: 24 + insets.bottom,
              },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onScroll={onScrollForRefreshGate}
            scrollEventThrottle={16}
            refreshControl={
              <PullToRefreshControl
                refreshing={isRefreshing || loading}
                onRefresh={onRefresh}
                scrollAtTop={scrollAtTop}
              />
            }
          >
            {renderHomeScrollContent()}
          </ScrollView>
        </View>
      )}

      <Modal
        visible={houseModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          const picked = houseId && tenantHouses.some((h) => h.id === houseId);
          if (tenantHouses.length > 1 && !picked) return;
          setHouseModalVisible(false);
        }}
      >
        <TouchableWithoutFeedback
          onPress={() => {
            const picked = houseId && tenantHouses.some((h) => h.id === houseId);
            if (tenantHouses.length > 1 && !picked) return;
            setHouseModalVisible(false);
          }}
        >
          <View style={homeStyles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={homeStyles.modalContent}>
                <Text style={homeStyles.modalTitle}>
                  {t("home.select_main_house")}
                </Text>
                <FlatList
                  data={tenantHouses}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        homeStyles.houseItem,
                        item.id === myHouse?.id && homeStyles.houseItemActive,
                      ]}
                      onPress={() => handleSelectMainHouse(item.id)}
                      disabled={isSubmittingMainHouse}
                    >
                      <Text
                        style={[
                          homeStyles.houseItemText,
                          item.id === myHouse?.id && homeStyles.houseItemTextActive,
                        ]}
                      >
                        {item.name}
                      </Text>
                      {isSubmittingMainHouse && item.id === pendingMainHouseId ? (
                        <RefreshLogoInline logoPx={18} />
                      ) : item.id === myHouse?.id ? (
                        <Text style={{ color: brandPrimary, fontWeight: "bold" }}>✓</Text>
                      ) : null}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={homeStyles.separator} />}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <IotPushAlertOverlay />

      {/* PREMIUM upgrade modal — bottom sheet style. Tier flip is driven
          by VNPay IPN to BE; this modal just hands the user the signed
          checkout URL via WebBrowser.openBrowserAsync. */}
      <Modal
        visible={premiumModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPremiumModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPremiumModalOpen(false)}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.55)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: "#fff",
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  paddingTop: 8,
                  paddingHorizontal: 20,
                  paddingBottom: 24 + insets.bottom,
                  maxHeight: "85%",
                }}
              >
                {/* Drag handle */}
                <View style={{ alignSelf: "center", width: 44, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", marginBottom: 12 }} />

                {/* Hero badge + title */}
                <View style={{ alignItems: "center", marginBottom: 16 }}>
                  <View style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: "#FEF3C7",
                    borderWidth: 2, borderColor: "#F59E0B",
                    alignItems: "center", justifyContent: "center",
                    marginBottom: 10,
                  }}>
                    <Text style={{ fontSize: 28 }}>👑</Text>
                  </View>
                  <Text style={{ fontSize: 20, fontWeight: "800", color: "#1E2D28", textAlign: "center" }}>
                    {t("home.premium_modal_title", "Nâng cấp PREMIUM")}
                  </Text>
                  <Text style={{ fontSize: 13, color: "#6B7280", textAlign: "center", marginTop: 4, paddingHorizontal: 8 }}>
                    {t("home.premium_modal_desc", "Nhận cảnh báo IoT khẩn cấp qua cuộc gọi và SMS. Chọn gói phù hợp.")}
                  </Text>
                </View>

                <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {premiumPlansLoading ? (
                  <View style={{ alignItems: "center", paddingVertical: 32 }}>
                    <Text style={{ fontSize: 32 }}>⏳</Text>
                    <Text style={{ color: "#6B7280", marginTop: 8 }}>
                      {t("common.loading", "Đang tải...")}
                    </Text>
                  </View>
                ) : premiumPlans.length === 0 ? (
                  <View style={{ alignItems: "center", paddingVertical: 32, paddingHorizontal: 20 }}>
                    <Text style={{ fontSize: 32 }}>📭</Text>
                    <Text style={{ fontWeight: "600", color: "#1F2937", marginTop: 8 }}>
                      {t("home.premium_empty_title", "Chưa có gói nào")}
                    </Text>
                    <Text style={{ color: "#6B7280", textAlign: "center", marginTop: 4, fontSize: 13 }}>
                      {t("home.premium_empty_desc", "Vui lòng thử lại sau hoặc liên hệ quản trị viên.")}
                    </Text>
                  </View>
                ) : premiumPlans.map((plan) => {
                  const ref = premiumPlans.find((p) => p.durationDays === 30) ?? premiumPlans[0];
                  const refPerDay = ref.priceVnd / Math.max(1, ref.durationDays);
                  const planPerDay = plan.priceVnd / Math.max(1, plan.durationDays);
                  const discountPct = Math.max(0, Math.round((1 - planPerDay / refPerDay) * 100));
                  const isLoading = premiumPlanLoading === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      disabled={premiumPlanLoading != null}
                      activeOpacity={0.7}
                      onPress={async () => {
                        try {
                          setPremiumPlanLoading(plan.id);
                          if (!houseId) {
                            CustomAlert.alert(
                              t("common.error", "Lỗi"),
                              t("home.premium_no_house", "Vui lòng chọn nhà trước khi mua gói."),
                              [{ text: t("common.close", "Đóng") }],
                              { type: "error" }
                            );
                            return;
                          }
                          const url = await createSubscriptionPaymentLink({ houseId, planId: plan.id });
                          // Hand the signed URL to the in-app WebView so the
                          // checkout stays inside the app shell — no system
                          // browser, no URL bar exposing the gateway host.
                          setPremiumModalOpen(false);
                          setPaymentWebViewUrl(url);
                        } catch (e: any) {
                          CustomAlert.alert(
                            t("common.error", "Lỗi"),
                            e?.message ?? "Failed",
                            [{ text: t("common.close", "Đóng") }],
                            { type: "error" }
                          );
                        } finally {
                          setPremiumPlanLoading(null);
                        }
                      }}
                      style={{
                        marginBottom: 10,
                        borderRadius: 14,
                        borderWidth: plan.isFeatured ? 2 : 1,
                        borderColor: plan.isFeatured ? "#F59E0B" : "#E5E7EB",
                        backgroundColor: plan.isFeatured ? "#FFFBEB" : "#fff",
                        overflow: "hidden",
                        opacity: premiumPlanLoading != null && !isLoading ? 0.4 : 1,
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 1 },
                        elevation: 1,
                      }}
                    >
                      {/* Featured ribbon */}
                      {plan.isFeatured ? (
                        <View style={{ backgroundColor: "#F59E0B", paddingVertical: 4, alignItems: "center" }}>
                          <Text style={{ fontSize: 11, fontWeight: "700", color: "#fff", letterSpacing: 1 }}>
                            ⭐ {t("home.premium_featured", "PHỔ BIẾN NHẤT")}
                          </Text>
                        </View>
                      ) : null}

                      <View style={{ flexDirection: "row", alignItems: "center", padding: 14 }}>
                        {/* Left — name + duration + savings pill */}
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1F2937" }}>
                            {planDisplayName(plan, i18n.language)}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 }}>
                            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "#F3F4F6" }}>
                              <Text style={{ fontSize: 11, color: "#374151", fontWeight: "600" }}>
                                {plan.durationDays} {t("home.premium_days", "ngày")}
                              </Text>
                            </View>
                            {discountPct > 0 ? (
                              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "#D1FAE5" }}>
                                <Text style={{ fontSize: 11, color: "#065F46", fontWeight: "700" }}>
                                  -{discountPct}%
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        </View>

                        {/* Right — price stack */}
                        <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
                          <Text style={{ fontSize: 18, fontWeight: "800", color: "#92400E" }}>
                            {plan.priceVnd.toLocaleString("vi-VN")}đ
                          </Text>
                          <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
                            {isLoading
                              ? t("home.premium_processing", "Đang tạo link...")
                              : `${Math.round(planPerDay).toLocaleString("vi-VN")}đ/${t("home.premium_day", "ngày")}`}
                          </Text>
                        </View>

                        {/* Chevron — affordance that the row is tappable */}
                        <Text style={{ fontSize: 22, color: "#D1D5DB", marginLeft: 8, fontWeight: "300" }}>›</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                </ScrollView>

                {/* Footer — legal small print + close button */}
                <Text style={{
                  fontSize: 11, color: "#9CA3AF", textAlign: "center",
                  marginTop: 8, marginBottom: 12,
                }}>
                  {t("home.premium_legal", "Thanh toán qua VNPay. Gói tự kích hoạt sau khi giao dịch thành công.")}
                </Text>
                <TouchableOpacity
                  onPress={() => setPremiumModalOpen(false)}
                  style={{
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "#F3F4F6",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#374151", fontWeight: "600" }}>
                    {t("common.close", "Đóng")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* In-app VNPay checkout — keeps the gateway URL hidden behind a native
          header. Tier flip lands via Kafka IPN to the BE, so on return we
          just invalidate the subscription query and surface a toast. */}
      <InAppPaymentWebView
        visible={paymentWebViewUrl != null}
        url={paymentWebViewUrl}
        onClose={() => {
          setPaymentWebViewUrl(null);
          setPremiumPlanLoading(null);
        }}
        onPaymentResult={(result) => {
          setPaymentWebViewUrl(null);
          setPremiumPlanLoading(null);
          // Invalidate regardless of success — IPN may land seconds later;
          // refetch ensures the badge reflects PREMIUM as soon as the BE
          // listener processes the Kafka event.
          queryClient.invalidateQueries({ queryKey: ["notif", "subscription"] });
          if (result.success) {
            CustomAlert.alert(
              t("payment.success_title", "Thanh toán thành công"),
              t(
                "payment.success_desc",
                "Gói PREMIUM sẽ được kích hoạt trong vài giây. Cảm ơn bạn!"
              ),
              [{ text: t("common.close", "Đóng") }],
              { type: "success" }
            );
          } else {
            CustomAlert.alert(
              t("payment.failed_title", "Thanh toán không thành công"),
              t(
                "payment.failed_desc_with_code",
                "Giao dịch chưa hoàn tất (mã {{code}}). Bạn có thể thử lại.",
                { code: result.responseCode ?? "?" }
              ),
              [{ text: t("common.close", "Đóng") }],
              { type: "error" }
            );
          }
        }}
      />
    </View>
  );
};

export default HomeScreen;
