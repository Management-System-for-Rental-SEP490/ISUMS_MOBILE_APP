import { StyleSheet } from "react-native";
import {
  BRAND_DANGER,
  brandPrimary,
  brandSecondary,
  brandTintBg,
  neutral,
} from "../../../../shared/theme/color";
import { tenantSoftCard } from "../../../../shared/styles/tenantSoftCard";

const ELEV_CARD = {
  shadowColor: neutral.black,
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.08,
  shadowRadius: 20,
  elevation: 6,
};

/** Khoảng cách dọc giữa các card SOFT trên Home — card sau dùng marginTop: 0 để tránh cộng đôi. */
export const HOME_CARD_STACK_GAP = 12;

/** Chip tầng — bóng nhẹ, bo mềm; active dùng bóng gắn brand */
const SOFT_CHIP = {
  shadowColor: neutral.black,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 2,
};

/** Xanh đậm — viền/halo chip đang chọn (tương phản rõ hơn nền loãng cũ) */
const brandPrimaryDark = "#2A9A6E";

import { appTypography } from "../../../../shared/utils";

export const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F4F6F8",
    },
    screenPadH: {
        paddingHorizontal: 16,
    },
    /** Thẻ khu vực + sơ đồ (màn chi tiết nhà). */
    homeZoneCard: {
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 16,
        ...tenantSoftCard,
    },
    areaSectionTopRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 6,
    },
    areaSectionTitles: {
        flex: 1,
        minWidth: 0,
    },
    areaSectionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: neutral.heading,
        letterSpacing: -0.3,
    },
    areaSectionSubtitle: {
        marginTop: 4,
        fontSize: 13,
        lineHeight: 18,
        color: neutral.textSecondary,
        fontWeight: "500",
    },
    floorChipsRow: {
        flexShrink: 0,
        maxWidth: "48%",
    },
    floorPlanInCard: {
        alignItems: "center",
        marginTop: 4,
        marginBottom: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    // Style cho phần Header thông tin nhà
    houseInfoCard: {
        backgroundColor: neutral.surface,
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Bóng đổ cho Android
    },
    houseTitle: {
        ...appTypography.cardTitle,
        color: neutral.heading,
        marginBottom: 8,
    },
    houseDetailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: 4,
    },
    houseLabel: {
        ...appTypography.labelRow,
        color: neutral.textSecondary,
        width: 80,
    },
    houseValue: {
        ...appTypography.labelRowValue,
        color: neutral.textBody,
        flex: 1,
    },
    
    // Style cho phần danh sách thiết bị (dùng lại nơi khác)
    sectionTitle: {
        ...appTypography.sectionHeading,
        color: neutral.heading,
        marginLeft: 16,
        marginBottom: 8,
        marginTop: 8,
    },
    /** Thanh chọn tầng — gói gọn bên phải header */
    deviceFloorScroll: {
        marginBottom: 0,
        marginTop: 0,
    },
    deviceFloorContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 2,
        paddingRight: 4,
        paddingLeft: 0,
    },
    /** Chip tầng: nghỉ = viền tinh; chọn = pill đặc brand + chữ trắng (tránh nền rgba “đục”) */
    deviceFloorChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: neutral.surface,
        borderWidth: 1,
        borderColor: "rgba(15, 23, 42, 0.08)",
        minHeight: 36,
        justifyContent: "center",
        ...SOFT_CHIP,
    },
    deviceFloorChipActive: {
        backgroundColor: brandPrimary,
        borderWidth: 0,
        borderColor: "transparent",
        shadowColor: brandPrimaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 5,
    },
    deviceFloorChipText: {
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: -0.15,
        color: neutral.slate600,
    },
    deviceFloorChipTextActive: {
        color: neutral.surface,
        fontWeight: "700",
        letterSpacing: -0.2,
    },
    deviceListContent: {
        paddingBottom: 20,
        paddingTop: 4,
    },
    deviceCard: {
        backgroundColor: neutral.surface,
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: neutral.border,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    deviceLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    deviceIconPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: brandTintBg,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        ...appTypography.listTitle,
        color: neutral.text,
    },
    deviceLocation: {
        ...appTypography.listSubtitle,
        color: neutral.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        ...appTypography.badge,
    },
    /** Thanh cuộn ngang chọn danh mục (category) từ API asset/categories */
    categoryScroll: {
        marginTop: 4,
        marginBottom: 10, // tạo khoảng cách giữa thanh category và danh sách thiết bị
    },
    categoryContent: {
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 16,
        paddingLeft: 16,
        paddingBottom: 4,
    },
    categoryChip: {
        marginRight: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: neutral.surface,
        borderWidth: 1,
        borderColor: neutral.border,
    },
    categoryChipActive: {
        backgroundColor: brandPrimary,
        borderColor: brandPrimary,
    },
    categoryChipText: {
        ...appTypography.chip,
        color: neutral.textSecondary,
    },
    categoryChipTextActive: {
        color: neutral.surface,
    },
    // Nhóm theo danh mục
    devicesEmpty: {
        marginTop: 16,
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: neutral.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: neutral.border,
        alignItems: "center",
    },
    devicesEmptyText: {
        ...appTypography.body,
        color: neutral.slate400,
        textAlign: "center",
    },
    /**
     * Tổng quan tiêu thụ — thẻ SOFT_CARD bọc ngoài (đồng bộ nhà đang ở / thao tác nhanh).
     * Trong cùng thẻ: tiêu đề + IoT LIVE; bên dưới lồng 2 thẻ con Điện / Nước (kiểu cũ).
     */
    usageSummarySection: {
        marginHorizontal: 16,
        marginTop: 0,
        marginBottom: HOME_CARD_STACK_GAP,
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 16,
        ...tenantSoftCard,
    },
    usageSummaryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    /** Cùng độ đậm với `utilitySectionTitle` */
    usageSummaryTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: neutral.black,
        letterSpacing: -0.35,
        flex: 1,
        minWidth: 0,
        paddingRight: 8,
    },
    /** Trạng thái IoT — chỉ chấm + chữ, không nền/viền to (đặc biệt khi OFFLINE). */
    usageSummaryLiveRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        flexShrink: 0,
    },
    usageSummaryLiveDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    usageSummaryLiveText: {
        fontSize: 11,
        fontWeight: "500",
        letterSpacing: 0.15,
        flexShrink: 1,
    },
    usageSummaryCards: {
        flexDirection: "row",
        alignItems: "stretch",
        width: "100%",
    },
    /**
     * Cột cố định 50/50 — bọc ngoài Pressable vì Android đôi khi không chia flex đều trực tiếp trên Pressable.
     */
    usageSummaryCardWrap: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minWidth: 0,
    },
    usageSummaryCardWrapFirst: {
        marginRight: 6,
    },
    usageSummaryCardWrapSecond: {
        marginLeft: 6,
    },
    /** Thẻ con Điện / Nước — nằm trong `usageSummaryCardWrap`. */
    usageSummaryCard: {
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
        backgroundColor: neutral.surface,
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 4,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    usageSummaryCardTitle: {
        ...appTypography.itemTitle,
        color: neutral.textBody,
        marginBottom: 8,
    },
    usageSummaryCardRow: {
        ...appTypography.caption,
        color: neutral.textSecondary,
        marginBottom: 4,
    },
    usageSummaryCardMonth: {
        fontWeight: "600",
        color: neutral.heading,
    },

    /**
     * Footer Home — cấu trúc tương tự Keycloak `isumsSiteFooterV2` (badge + build, support, links, bản quyền).
     */
    homeSiteFooter: {
        marginHorizontal: 16,
        marginTop: HOME_CARD_STACK_GAP * 2,
        marginBottom: HOME_CARD_STACK_GAP,
        paddingVertical: 16,
        paddingHorizontal: 14,
        backgroundColor: neutral.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)",
        alignItems: "center",
    },
    homeSiteFooterVersionRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 14,
        alignSelf: "stretch",
    },
    homeSiteFooterPill: {
        backgroundColor: brandTintBg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    homeSiteFooterPillText: {
        fontSize: 10,
        fontWeight: "800",
        color: brandPrimaryDark,
        letterSpacing: 0.5,
    },
    homeSiteFooterDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: neutral.textMuted,
    },
    homeSiteFooterBuild: {
        fontSize: 11,
        fontWeight: "600",
        color: neutral.textSecondary,
    },
    homeSiteFooterSupport: {
        fontSize: 12,
        lineHeight: 18,
        color: neutral.textSecondary,
        marginBottom: 12,
        textAlign: "center",
        alignSelf: "stretch",
    },
    homeSiteFooterLinksRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
        alignSelf: "stretch",
    },
    homeSiteFooterLink: {
        fontSize: 12,
        fontWeight: "600",
        color: brandSecondary,
        textDecorationLine: "underline",
    },
    homeSiteFooterLinkMuted: {
        fontSize: 12,
        fontWeight: "500",
        color: neutral.textMuted,
    },
    homeSiteFooterCopy: {
        fontSize: 10,
        lineHeight: 14,
        color: neutral.textMuted,
        fontWeight: "500",
        letterSpacing: 0.15,
        textAlign: "center",
        alignSelf: "stretch",
    },

    /** Một dòng nhắc nhở phía trên Home khi chưa đủ điều kiện (không phủ toàn màn). */
    accessReminderBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 16,
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: brandTintBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(15, 23, 42, 0.08)",
    },
    accessReminderBannerTappable: {
        borderColor: "rgba(42, 154, 110, 0.35)",
    },
    accessReminderBannerText: {
        flex: 1,
        minWidth: 0,
        fontSize: 13,
        fontWeight: "600",
        lineHeight: 18,
        color: brandPrimaryDark,
    },
    accessReminderPayNowBtn: {
        flexShrink: 0,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 8,
        backgroundColor: BRAND_DANGER,
        alignItems: "center",
        justifyContent: "center",
    },
    accessReminderPayNowBtnText: {
        fontSize: 11,
        fontWeight: "800",
        color: neutral.surface,
        letterSpacing: -0.05,
    },
    /** Banner chặn khi chưa đủ điều kiện truy cập app/nhà (GET /api/houses/my-access). */
    accessGateOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.16)",
        justifyContent: "flex-start",
        alignItems: "center",
        paddingHorizontal: 16,
        zIndex: 100,
    },
    accessGateBannerCard: {
        backgroundColor: neutral.surface,
        borderRadius: 14,
        padding: 16,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: neutral.border,
        width: "100%",
        maxWidth: 560,
    },
    accessGateCardTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: neutral.heading,
        marginBottom: 10,
        textAlign: "center",
    },
    accessGateCardBody: {
        fontSize: 15,
        lineHeight: 22,
        color: neutral.textSecondary,
        textAlign: "center",
        marginBottom: 16,
    },
    accessGatePrimaryBtn: {
        backgroundColor: brandPrimary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    accessGatePrimaryBtnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    accessGateEmptyWrap: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    accessGateEmptyText: {
        textAlign: "center",
        color: neutral.textSecondary,
        fontSize: 15,
        lineHeight: 22,
    },
    
    // Styles cho Modal chọn nhà
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: neutral.surface,
        borderRadius: 12,
        width: '100%',
        maxHeight: '60%',
        padding: 20,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        ...appTypography.modalTitle,
        marginBottom: 16,
        color: neutral.heading,
        textAlign: 'center',
    },
    houseItem: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 8,
    },
    houseItemActive: {
        backgroundColor: brandTintBg,
    },
    houseItemText: {
        ...appTypography.modalListItem,
        color: neutral.textBody,
    },
    houseItemTextActive: {
        color: brandSecondary,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        backgroundColor: neutral.border,
    },
    switchHouseButton: {
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        backgroundColor: brandTintBg, 
        borderRadius: 10,
    },
    switchHouseText: {
        ...appTypography.caption,
        fontSize: 14,
        color: brandSecondary,
        fontWeight: '600',
    },
    /** Thẻ nhà đang ở + đổi nhà (phía trên thao tác nhanh) */
    currentHouseSection: {
        marginHorizontal: 16,
        marginTop: HOME_CARD_STACK_GAP,
        marginBottom: HOME_CARD_STACK_GAP,
        paddingVertical: 14,
        paddingHorizontal: 14,
        ...tenantSoftCard,
    },
    currentHouseRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    currentHouseTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    currentHouseEyebrow: {
        fontSize: 12,
        fontWeight: "600",
        color: neutral.textSecondary,
        marginBottom: 4,
        letterSpacing: 0.2,
    },
    currentHouseName: {
        fontSize: 16,
        fontWeight: "800",
        color: neutral.heading,
        letterSpacing: -0.3,
    },
    switchHousePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: brandTintBg,
        borderRadius: 999,
        flexShrink: 0,
    },
    switchHousePillText: {
        fontSize: 13,
        fontWeight: "700",
        color: brandSecondary,
    },
    /** Khối “Quick actions” — cùng SOFT_CARD; marginTop gán ở Home (0 nếu đã có thẻ nhà). */
    utilitySection: {
        marginHorizontal: 16,
        marginTop: 0,
        marginBottom: HOME_CARD_STACK_GAP,
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 16,
        ...tenantSoftCard,
    },
    utilitySectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: neutral.black,
        marginBottom: 12,
        letterSpacing: -0.35,
    },
    /** Cột các hàng tiện ích — mỗi hàng 3 ô co giãn theo chiều ngang (flex), hàng lẻ có spacer. */
    utilityGridColumn: {
        flexDirection: "column",
        alignItems: "stretch",
    },
    /** Một hàng luôn 3 cột — mỗi cột một `utilityCellSlot` (có nút hoặc để trống). */
    utilityRow: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    /** Một ô cột: luôn chiếm đúng 1/3 hàng (trừ gap), kích thước giống mọi hàng. */
    utilityCellSlot: {
        flex: 1,
        flexBasis: 0,
        minWidth: 0,
    },
    /** Nút lấp đầy ô — không kéo rộng theo số nút còn lại trên hàng. */
    utilityItem: {
        flex: 1,
        width: "100%",
        alignSelf: "stretch",
        minHeight: 68,
        borderRadius: 11,
        paddingVertical: 5,
        paddingHorizontal: 2,
        alignItems: "center",
        justifyContent: "center",
        /** Không dùng hidden — trên Android dễ cắt mất glyph vector icon trong ô hẹp. */
    },
    utilityIconSlot: {
        marginBottom: 3,
        minHeight: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    utilityLabel: {
        color: neutral.text,
        textAlign: "center",
        fontWeight: "600",
    },
    /** Card “Phản hồi” — ngay dưới Thao tác nhanh */
    questionFeedbackSection: {
        marginHorizontal: 16,
        marginTop: 0,
        marginBottom: HOME_CARD_STACK_GAP,
        paddingHorizontal: 16,
        paddingTop: 18,
        paddingBottom: 16,
        ...tenantSoftCard,
    },
    questionFeedbackSectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: neutral.black,
        marginBottom: 12,
        letterSpacing: -0.35,
    },
    /** Nội dung xoay vòng trong card Phản hồi */
    questionTickerWrap: {
        marginBottom: 0,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#EEF2FF",
        borderWidth: 1,
        borderColor: "rgba(79, 70, 229, 0.14)",
    },
    questionTickerPress: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 12,
        paddingHorizontal: 12,
        gap: 10,
    },
    questionTickerIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(79, 70, 229, 0.14)",
        alignItems: "center",
        justifyContent: "center",
    },
    questionTickerBody: {
        flex: 1,
        minWidth: 0,
    },
    questionTickerText: {
        fontSize: 14,
        lineHeight: 20,
        fontWeight: "600",
        color: neutral.heading,
    },
    questionTickerMeta: {
        fontSize: 11,
        marginTop: 4,
        color: neutral.textMuted,
        fontWeight: "500",
    },
    questionTickerChevron: {
        paddingTop: 2,
        flexShrink: 0,
    },
    questionTickerDots: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 5,
        paddingBottom: 10,
        paddingTop: 0,
    },
    questionTickerDot: {
        width: 5,
        height: 5,
        borderRadius: 999,
        backgroundColor: "rgba(79, 70, 229, 0.28)",
    },
    questionTickerDotActive: {
        backgroundColor: "#4F46E5",
        width: 14,
    },
    /** Modal thông báo IoT một lần trên Home (chạm nền để đóng). */
    iotHomeAlertModalWrap: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.45)",
    },
    iotHomeAlertBackdropTap: {
        flex: 1,
    },
    iotHomeAlertCardOuter: {
        paddingHorizontal: 16,
    },
    iotHomeAlertCard: {
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderLeftWidth: 4,
        backgroundColor: neutral.surface,
        ...ELEV_CARD,
    },
    iotHomeAlertCardTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    iotHomeAlertIconBubble: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    iotHomeAlertTextBlock: {
        flex: 1,
        minWidth: 0,
    },
    iotHomeAlertTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: neutral.heading,
        letterSpacing: -0.2,
    },
    iotHomeAlertSub: {
        fontSize: 12,
        fontWeight: "600",
        color: neutral.textSecondary,
        marginTop: 4,
    },
    iotHomeAlertHint: {
        fontSize: 11,
        fontWeight: "600",
        color: neutral.textMuted,
        marginTop: 10,
    },
    // ============================================================
    // Marketplace section — "Nhà có thể chuyển sang"
    // ============================================================
    marketplaceSection: {
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: neutral.surface,
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: neutral.border,
    },
    marketplaceHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 12,
    },
    marketplaceTitle: {
        fontSize: 16,
        fontWeight: "800",
        color: neutral.text,
    },
    marketplaceSubtitle: {
        fontSize: 12,
        fontWeight: "600",
        color: neutral.textMuted,
        marginTop: 2,
    },
    marketplaceLoading: {
        height: 80,
        alignItems: "center",
        justifyContent: "center",
    },
    marketplaceListContent: {
        paddingHorizontal: 16,
        gap: 12,
    },
    marketplaceCard: {
        width: 220,
        backgroundColor: neutral.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: neutral.border,
        padding: 14,
        gap: 6,
        shadowColor: neutral.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    marketplaceCardPressed: {
        opacity: 0.92,
    },
    marketplaceBadge: {
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1,
        marginBottom: 4,
    },
    marketplaceBadgeAvailable: {
        backgroundColor: "#DCFCE7",
        borderColor: "#16A34A",
    },
    marketplaceBadgeBookable: {
        backgroundColor: "#FEF3C7",
        borderColor: "#D97706",
    },
    marketplaceBadgeText: {
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 0.3,
        textTransform: "uppercase",
    },
    marketplaceBadgeTextAvailable: {
        color: "#15803D",
    },
    marketplaceBadgeTextBookable: {
        color: "#92400E",
    },
    marketplaceCardTitle: {
        fontSize: 14,
        fontWeight: "800",
        color: neutral.text,
    },
    marketplaceCardAddress: {
        fontSize: 12,
        fontWeight: "600",
        color: neutral.textMuted,
        lineHeight: 17,
    },
    marketplaceCardHandover: {
        fontSize: 11,
        fontWeight: "700",
        color: "#92400E",
        marginTop: 4,
    },
    marketplaceCardAvailableNow: {
        fontSize: 11,
        fontWeight: "700",
        color: "#15803D",
        marginTop: 4,
    },
});

export default homeStyles;
