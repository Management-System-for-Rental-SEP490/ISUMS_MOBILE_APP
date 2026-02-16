import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

const TenantsScreen = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>{t('tenants.title')}</Text>
      <Text style={styles.subtitle}>
        {t('tenants.subtitle')}
      </Text>
    </View>
  );
};

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

export default TenantsScreen;

