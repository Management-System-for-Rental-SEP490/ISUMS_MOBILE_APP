
import { ColorValue, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import headerStyles from "../styles/headerStyles";
import Icons from "../theme/icon";

const Header = () => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={["#3bb582", "rgba(12, 106, 181, 0.88)"] as [ColorValue, ColorValue]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[headerStyles.gradient, { paddingTop: insets.top + 12 }]}
    >
      <View style={headerStyles.headerRow}>
        <View style={headerStyles.brandRow}>
          <View style={headerStyles.logoWrapper}>
            <Icons.logoHome size={40} />
          </View>
          <Text style={headerStyles.brandTitle}>ISUMS APP</Text>
        </View>
        <TouchableOpacity style={headerStyles.userIcon}>
          <Icons.user size={22} color="#0f172a" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default Header;
