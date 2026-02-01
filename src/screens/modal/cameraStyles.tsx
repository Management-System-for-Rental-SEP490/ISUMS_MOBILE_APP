import { StyleSheet } from "react-native";

const cameraStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    camera: { flex: 1 },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: "center",
      alignItems: "center",
    },
    scanBox: {
      width: 260,
      height: 260,
      borderRadius: 18,
      borderWidth: 2,
      borderColor: "#0ea5e9",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(14, 165, 233, 0.12)",
    },
    scanText: { color: "#fff", textAlign: "center" },
    footer: {
      position: "absolute",
      bottom: 40,
      left: 20,
      right: 20,
    },
    button: {
      backgroundColor: "#0ea5e9",
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      marginBottom: 12,
    },
    buttonDisabled: {
      backgroundColor: "#64748b",
    },
    buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
    deviceInfo: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 14,
    },
    deviceName: { fontSize: 18, fontWeight: "700", marginBottom: 4 },
    close: {
      position: "absolute",
      top: 60,
      right: 20,
      backgroundColor: "rgba(15,23,42,0.7)",
      paddingVertical: 6,
      paddingHorizontal: 16,
      borderRadius: 20,
    },
    closeText: { color: "#fff" },
  });

  export default cameraStyles;