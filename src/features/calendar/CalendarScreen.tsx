import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

const CalendarScreen = () => {
  const { t } = useTranslation();
  return <View>
    <Text>{t('screens.calendar')}</Text>
  </View>
};

export default CalendarScreen;