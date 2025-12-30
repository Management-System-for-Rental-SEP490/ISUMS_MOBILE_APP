import { StyleSheet } from "react-native";

const registerStyles = StyleSheet.create({
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
    form: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 6,
        marginBottom: 100,
    },
    title: {
        fontSize: 24,
        fontWeight: "600",
        marginBottom: 16,
        color: "#0f172a",
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 6,
        color: "#475467",
    },
    input: {
        borderWidth: 1,
        borderColor: "#d0d7de",
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: 16,
        fontSize: 16,
        color: "#111827",
        backgroundColor: "#f8fafc",
    },
    button: {
        marginTop: 8,
        backgroundColor: "#2563eb",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
    linkRow: {
        marginTop: 12,
        alignItems: "center",
    },
    linkText: {
        color: "#2563eb",
        fontWeight: "600",
    },
});

export default registerStyles;