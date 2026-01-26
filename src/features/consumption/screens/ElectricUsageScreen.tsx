import { View, Text, StyleSheet } from "react-native";
import Header from "../../../shared/components/header";

const ElectricUsageScreen = () => {
  return (
    <View>
      <Header/>
  <View>
      <View style={styles.screen}>
        <Text>Electric</Text>
      </View>
    </View>
  </View>
);  }

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ElectricUsageScreen;