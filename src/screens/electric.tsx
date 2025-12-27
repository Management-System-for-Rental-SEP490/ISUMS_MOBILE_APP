import { View, Text, StyleSheet } from "react-native";

const Electric = () => (
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

export default Electric;