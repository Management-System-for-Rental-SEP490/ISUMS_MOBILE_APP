import { StyleSheet } from "react-native";
export const homeStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
    },
    footer: {
        width: "100%",
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        paddingVertical: 12,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 64,
        marginBottom: 9,
        
    },
});
export default homeStyles;