import { StyleSheet } from "react-native";
import {
  brandPrimary,
  brandSecondary,
  brandTintBg,
  neutral,
} from "../../../../shared/theme/color";
import { appTypography } from "../../../../shared/utils";

export const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: neutral.background,
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
    
    // Style cho phần danh sách thiết bị
    sectionTitle: {
        ...appTypography.sectionHeading,
        color: neutral.heading,
        marginLeft: 16,
        marginBottom: 8,
        marginTop: 8,
    },
    /** Thanh chọn tầng trên Home (gọn, sát sơ đồ). */
    deviceFloorScroll: {
        marginBottom: 2,
        marginTop: 0,
    },
    deviceFloorContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 2,
        paddingLeft: 16,
        paddingRight: 16,
    },
    deviceFloorChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: neutral.surface,
        borderWidth: 1,
        borderColor: neutral.border,
        minHeight: 32,
        justifyContent: "center",
    },
    deviceFloorChipActive: {
        backgroundColor: brandTintBg,
        borderColor: brandPrimary,
    },
    deviceFloorChipText: {
        fontSize: 12,
        fontWeight: "600",
        color: neutral.textSecondary,
    },
    deviceFloorChipTextActive: {
        color: brandPrimary,
    },
    deviceListContent: {
        paddingBottom: 20,
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
    /** Block tổng quan tiêu thụ IoT (điện + nước) trên Home */
    usageSummarySection: {
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 4,
    },
    usageSummaryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    usageSummaryTitle: {
        ...appTypography.sectionHeading,
        color: neutral.heading,
    },
    usageSummaryLiveChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: 1,
    },
    usageSummaryLiveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    usageSummaryLiveText: {
        ...appTypography.badge,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    usageSummaryCards: {
        flexDirection: "row",
        gap: 12,
    },
    usageSummaryCard: {
        flex: 1,
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
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        backgroundColor: brandTintBg, 
        borderRadius: 6,
    },
    switchHouseText: {
        ...appTypography.caption,
        color: brandSecondary,
        fontWeight: '600',
    }
});

export default homeStyles;
