import { View, Text, StyleSheet } from "react-native";

const ElectricUsageScreen = () => (
  <View style={styles.screen}>
    <Text>Electric</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ElectricUsageScreen;