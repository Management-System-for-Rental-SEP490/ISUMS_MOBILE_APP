import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import Home from "../screens/home";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import User from "../screens/user";
import Electric from "../screens/electric";
import Water from "../screens/water";
import { RootStackParamList } from "../types";
import Footer from "../components/footer";

const Stack = createNativeStackNavigator<RootStackParamList>();

const Navigation = () => {
  return (
    <NavigationContainer>
      <View style={styles.layout}>
        <View style={styles.screenWrapper}>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="User" component={User} />
            <Stack.Screen name="Electric" component={Electric} />
            <Stack.Screen name="Water" component={Water} />
          </Stack.Navigator>
        </View>
        <Footer />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  layout: {
    flex: 1,
    backgroundColor: "white",
  },
  screenWrapper: {
    flex: 1,
  },
});

export default Navigation;