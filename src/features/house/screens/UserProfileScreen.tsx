import { View, Text, StyleSheet } from "react-native";

const UserProfileScreen = () => (
  <View style={styles.screen}>
    <Text>User</Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default UserProfileScreen;