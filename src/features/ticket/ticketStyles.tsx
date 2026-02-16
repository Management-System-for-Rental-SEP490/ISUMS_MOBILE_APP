import { StyleSheet } from "react-native";

export const ticketStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F5F7FA",
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
    backButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 24,
        color: "#111827",
    },
    deviceInfoSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 12,
        color: "#111827",
    },
    deviceInfoCard: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    deviceInfoLabel: {
        fontSize: 14,
        color: "#6b7280",
        marginTop: 8,
        marginBottom: 4,
    },
    deviceInfoValue: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111827",
        marginBottom: 4,
    },
    formSection: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: "500",
        color: "#111827",
        marginBottom: 8,
    },
    required: {
        color: "#ef4444",
    },
    input: {
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#111827",
        backgroundColor: "#fff",
    },
    textArea: {
        minHeight: 120,
        paddingTop: 12,
    },
    priorityContainer: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8,
    },
    priorityButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#d1d5db",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    priorityButtonActive: {
        backgroundColor: "#0ea5e9", // Màu xanh nước biển phù hợp với hệ thống
        borderColor: "#0ea5e9",
    },
    priorityButtonText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6b7280",
        textAlign: "center", // Căn giữa text trong nút
    },
    priorityButtonTextActive: {
        color: "#fff",
        textAlign: "center", // Căn giữa text khi active
    },
    submitButton: {
        backgroundColor: "#0ea5e9", // Màu xanh nước biển phù hợp với hệ thống
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8,
        shadowColor: "#0ea5e9",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 3.84,
        elevation: 5,
    },
    submitButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});