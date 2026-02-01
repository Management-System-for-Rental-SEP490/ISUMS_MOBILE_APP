import { View, Text, StyleSheet } from "react-native";
import Header from "../../../shared/components/header";

const UserProfileScreen = () => (
  <View style={styles.container}>
    <Header variant="default" />
    <Text>User</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
});

export default UserProfileScreen;