import { View, Text, StyleSheet } from "react-native";

const Billing = () => (
  <View style={styles.screen}>
    <Text style={styles.title}>Bảng điều khiển Billing</Text>
    <Text style={styles.subtitle}>
      Tổng quan hóa đơn, thanh toán và các khoản phí phụ trợ dành cho chủ nhà.
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

export default Billing;

