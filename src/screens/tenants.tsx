import { View, Text, StyleSheet } from "react-native";

const Tenants = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Quản lý cư dân thuê</Text>
    <Text style={styles.subtitle}>
      Theo dõi hợp đồng, thông tin liên hệ và lịch sử thanh toán của từng tenant.
    </Text>
  </View>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: "#fefefe",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "#4b5563",
    textAlign: "center",
  },
});

export default Tenants;

