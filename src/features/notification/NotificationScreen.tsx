import { View, Text, StyleSheet } from "react-native";
import Header from "../../shared/components/header";

const NotificationScreen = () => {
  return( 
  <View style={styles.container}>
    <Header variant="default" />
    <Text>Notification</Text>
  </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
  },
});

export default NotificationScreen;