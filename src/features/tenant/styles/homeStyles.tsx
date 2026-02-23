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
});

export default homeStyles;
