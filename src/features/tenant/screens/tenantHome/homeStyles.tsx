import { StyleSheet } from "react-native";

export const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6", // Màu nền xám nhạt (Gray-100)
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    // Style cho phần Header thông tin nhà
    houseInfoCard: {
        backgroundColor: "white",
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // Bóng đổ cho Android
    },
    houseTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#1F2937", // Gray-800
        marginBottom: 8,
    },
    houseDetailRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 4,
    },
    houseLabel: {
        color: "#6B7280", // Gray-500
        width: 80,
        fontSize: 14,
    },
    houseValue: {
        color: "#374151", // Gray-700
        fontWeight: "500",
        fontSize: 14,
        flex: 1,
    },
    
    // Style cho phần danh sách thiết bị
    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#1F2937",
        marginLeft: 16,
        marginBottom: 8,
        marginTop: 8,
    },
    deviceListContent: {
        paddingBottom: 20,
    },
    deviceCard: {
        backgroundColor: "white",
        marginHorizontal: 16,
        marginBottom: 12,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB", // Gray-200
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
        backgroundColor: "#EEF2FF", // Indigo-50
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    deviceInfo: {
        flex: 1,
    },
    deviceName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#111827",
    },
    deviceLocation: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
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
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    categoryChipActive: {
        backgroundColor: "#2563EB",
        borderColor: "#2563EB",
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
    },
    categoryChipTextActive: {
        color: "#fff",
    },
    // Nhóm theo danh mục
    devicesEmpty: {
        marginTop: 16,
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        alignItems: "center",
    },
    devicesEmptyText: {
        fontSize: 14,
        color: "#94a3b8",
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
        fontSize: 16,
        fontWeight: "700",
        color: "#1F2937",
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
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    usageSummaryCards: {
        flexDirection: "row",
        gap: 12,
    },
    usageSummaryCard: {
        flex: 1,
        backgroundColor: "white",
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    usageSummaryCardTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#374151",
        marginBottom: 8,
    },
    usageSummaryCardRow: {
        fontSize: 12,
        color: "#6B7280",
        marginBottom: 4,
    },
    usageSummaryCardMonth: {
        fontWeight: "600",
        color: "#1F2937",
    },
});

export default homeStyles;
