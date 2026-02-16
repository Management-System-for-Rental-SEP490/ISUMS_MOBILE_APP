import { View, Text, StyleSheet } from "react-native";
import Header from "../../shared/components/header";
import { useTranslation } from "react-i18next";

const NotificationScreen = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <Header variant="default" />
      <View style={styles.screen}>
        <Text>{t('screens.notification')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NotificationScreen;