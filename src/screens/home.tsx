// Welcome to screens

import { Text, View, StyleSheet } from "react-native";

const Home = () => (
  <View style={styles.screen}>
    <Text>Home</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Home;

