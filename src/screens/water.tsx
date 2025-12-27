import { View, Text, StyleSheet } from "react-native";

const Water = () => (
  <View style={styles.screen}>
    <Text>Water</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Water;