import { StyleSheet } from "react-native";

export const cameraStyles = StyleSheet.create({
        container: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
        text: {
          textAlign: "center",
          marginBottom: 10,
        },
        button: {
          padding: 10,
          backgroundColor: "#2196F3",
          borderRadius: 5,
        },
        buttonText: {
          color: "white",
        },
        closeButton: {
          position: "absolute",
          bottom: 40,
          alignSelf: "center",
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: "rgba(0,0,0,0.7)",
          borderRadius: 20,
        },
        closeButtonText: {
          color: "#fff",
          fontSize: 16,
          fontWeight: "bold",
        },
        overlay: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        unfocusedContainer: {
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
        },
        middleContainer: {
          flexDirection: "row",
          height: 250,
        },
        focusedContainer: {
          width: 250,
          borderWidth: 2,
          borderColor: "#00FF00",
          backgroundColor: "transparent",
        },
      });