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
          position: "absolute", // "position: 'absolute'" có nghĩa là phần tử này sẽ được định vị tuyệt đối trên màn hình, tức là vị trí của nó sẽ được xác định dựa trên các thuộc tính như top, bottom, left, right so với vùng chứa gần nhất có thuộc tính position (không phải 'static'). 
          bottom: 40, // bottom: 40 là một thuộc tính của CSS, nó định nghĩa vị trí của phần tử theo hệ tọa độ của màn hình.
          alignSelf: "center", // alignSelf: "center" là một thuộc tính của CSS, nó định nghĩa vị trí của phần tử theo hệ tọa độ của màn hình.
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
          // borderWidth: 2,
          // borderColor: "#000000", // borderColor: "#00FF00" là một thuộc tính của CSS, nó định nghĩa màu sắc của viền của phần tử. xanh lá cây
          backgroundColor: "transparent",
        },
      });