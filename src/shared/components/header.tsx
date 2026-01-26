
import { ColorValue, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import headerStyles from "../styles/headerStyles";
import Icons from "../theme/icon";

type HeaderVariant = "default" | "electric" | "water";

const gradientMaps: Record<HeaderVariant, [ColorValue, ColorValue]> = {
  default: ["#3bb582", "rgba(12, 106, 181, 0.7)"],
  electric: ["#008001", "rgba(24, 90, 24, 0.9)"],
  water: ["#0072cf", "rgba(0, 114, 207, 0.9)"],
};

const Header = ({ variant = "default" }: { variant?: HeaderVariant }) => {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={gradientMaps[variant]}
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
