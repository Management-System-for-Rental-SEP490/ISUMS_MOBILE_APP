import { View, Text, StyleSheet } from "react-native";
import Header from "../../../shared/components/header";

const WaterUsageScreen = () => {
  return (
    <View style={styles.container}>
      <Header variant="water" />
      <View style={styles.screen}>
        <Text>Water</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default WaterUsageScreen;