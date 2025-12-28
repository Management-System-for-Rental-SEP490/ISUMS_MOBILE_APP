import { StyleSheet } from "react-native";


const loginStyles = StyleSheet.create({
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
        width: "100%",              // Chiều rộng tối đa (full width container)
        maxWidth: 420,              // Không vượt quá 420px (trên các thiết bị rộng)
        backgroundColor: "#ffffff", // Nền trắng cho form
        borderRadius: 20,           // Bo góc cho form mềm mại
        padding: 24,                // Padding bên trong form (giãn cách nội dung với viền)
        shadowColor: "#000",        // Màu bóng đổ (shadow) là đen
        shadowOffset: { width: 0, height: 4 }, // Độ lệch của bóng đổ: ngang 0, dọc 4px
        shadowOpacity: 0.1,         // Độ mờ của bóng đổ 10%
        shadowRadius: 10,           // Độ “mờ loang” của bóng đổ
        elevation: 6,               // "elevation" là thuộc tính để tạo hiệu ứng bóng đổ (shadow) và tạo cảm giác độ nổi cho thành phần trên thiết bị Android.
                     
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
});

export default loginStyles;