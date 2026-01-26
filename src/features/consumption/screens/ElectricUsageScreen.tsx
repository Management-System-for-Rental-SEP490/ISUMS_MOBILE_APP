import { View, Text, StyleSheet } from "react-native";
import Header from "../../../shared/components/header";

const ElectricUsageScreen = () => {
  return (
    <View style={styles.container}>
      <Header variant="electric" />
      <View style={styles.screen}>
        <Text>Electric</Text>
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

export default ElectricUsageScreen;