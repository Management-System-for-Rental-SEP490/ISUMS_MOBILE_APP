
import { ColorValue, Dimensions, Image, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import headerStyles from "../styles/headerStyles";
import { brandGradient, waterHeaderGradient } from "../theme/color";
import { appTypography } from "../utils/typography";
import { HeaderVariant, MainTabParamList } from "../types";
import { NavigationProp, useNavigation } from "@react-navigation/native";

const LOGO_ASSET = require("../../../assets/logob.png");
const LOGO_RING_PADDING = 3;

const brandHeaderGradient: [ColorValue, ColorValue] = [
  brandGradient[0],
  brandGradient[1],
];

const gradientMaps: Record<HeaderVariant, [ColorValue, ColorValue]> = {
  default: brandHeaderGradient,
  electric: brandHeaderGradient,
  water: waterHeaderGradient,
};

type HeaderProps = {
  variant?: HeaderVariant;
};

const Header = ({
  variant = "default",
}: HeaderProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 375;
  const logoOuter = isSmallScreen ? 40 : 48;
  const logoInner = logoOuter - LOGO_RING_PADDING * 2;
  const logoRadiusOuter = logoOuter / 2;
  const logoRadiusInner = logoInner / 2;

  return (
    <View style={headerStyles.container}>
      <LinearGradient
        colors={gradientMaps[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          headerStyles.gradient,
          { paddingTop: insets.top + 12 },
          isSmallScreen && { paddingHorizontal: 12 },
        ]}
      >
        <View
          style={[
            headerStyles.headerRow,
            headerStyles.headerRowCentered,
            isSmallScreen && { gap: 8 },
          ]}
        >
          <TouchableOpacity
            style={headerStyles.brandRow}
            activeOpacity={0.75}
            onPress={() => navigation.navigate("Dashboard")}
          >
            <View
              style={[
                headerStyles.logoRing,
                {
                  width: logoOuter,
                  height: logoOuter,
                  borderRadius: logoRadiusOuter,
                },
                isSmallScreen && { marginRight: 6 },
              ]}
            >
              <Image
                source={LOGO_ASSET}
                style={{
                  width: logoInner,
                  height: logoInner,
                  borderRadius: logoRadiusInner,
                }}
                resizeMode="cover"
                accessibilityLabel="ISUMS logo"
              />
            </View>
            <Text
              style={[
                headerStyles.brandTitle,
                isSmallScreen && appTypography.sectionHeading,
              ]}
            >
              ISUMS
            </Text>
          </TouchableOpacity>

        </View>
      </LinearGradient>
    </View>
  );
};

export default Header;
