import { StyleSheet } from "react-native";

const deviceDetailStyles = StyleSheet.create({
    background: {
        flex: 1,
        width: "100%",
        height: "100%",
    },
    overlay: { 
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        backgroundColor: "rgba(15, 23, 42, 0.35)",
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingBottom: 40,
    },
    backButton: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 20,
    },
    detailItem: {
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
        paddingBottom: 10,
    },
    detailItemLabel: {
        color: "#6b7280",
        fontSize: 14,
    },
    detailItemValue: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "500",
        marginTop: 4,
    },
    detailItemValueEmpty: {
        color: "#6b7280",
        fontSize: 14,
    },
    detailItemValueBold: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "700",
        marginTop: 4,
    },
    deviceInfo: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 14,
    },
    deviceName: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 4,
    },
    deviceId: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    deviceType: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    deviceLocation: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    deviceStatus: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    deviceNfcTagId: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    TechnicalInfoTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 10,
    },
    TechnicalInfoSerialNumber: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    TechnicalInfoManufacturer: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    TechnicalInfoModel: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    TechnicalInfoInstallationDate: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 4,
    },
    reportButton: {
        backgroundColor: "#0ea5e9", // Màu xanh nước biển phù hợp với hệ thống
        borderRadius: 12,
        padding: 16,
        marginTop: 24,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#0ea5e9",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
    },
    reportButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
    
});

export default deviceDetailStyles;