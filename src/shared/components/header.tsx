import {
  ActivityIndicator,
  ColorValue,
  Dimensions,
  Image,
  Text,
  Pressable,
  View,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import headerStyles from "../styles/headerStyles";
import { brandGradient, headerOnBrand, waterHeaderGradient } from "../theme/color";
import { appTypography } from "../utils/typography";
import { HeaderVariant, RootStackParamList } from "../types";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import Icons from "../theme/icon";

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

export type HomeHeaderWelcome = {
  /** Dòng phụ phía trên lời chào (tuỳ chọn). */
  eyebrow?: string;
  helloLine: string;
};

/** Dải số hóa đơn cần thanh toán dưới lời chào (Home); chuỗi i18n set ở HomeScreen. */
export type HomeHeaderInvoiceStrip =
  | { kind: "hidden" }
  | { kind: "loading" }
  | { kind: "all_paid"; caption: string }
  | { kind: "payable"; caption: string; urgent: boolean };

type HeaderProps = {
  variant?: HeaderVariant;
  showNotification?: boolean;
  /** Trang Home: header gọn — eyebrow + lời chào, không logo/ISUMS. */
  homeWelcome?: HomeHeaderWelcome;
  /** Home: bấm dòng chào tên chủ nhà → mở hồ sơ. */
  onHomeWelcomeNamePress?: () => void;
  /** Home: trạng thái hóa đơn (dưới lời chào). */
  homeInvoiceStrip?: HomeHeaderInvoiceStrip;
  /** Home: mở danh sách hóa đơn (nút cạnh cảnh báo). */
  onHomeInvoicePress?: () => void;
  /** Header mặc định (logo + ISUMS): nếu có thì bấm logo/brand gọi callback thay vì về Main. */
  onBrandPress?: () => void;
};

const Header = ({
  variant = "default",
  showNotification = true,
  homeWelcome,
  onHomeWelcomeNamePress,
  homeInvoiceStrip,
  onHomeInvoicePress,
  onBrandPress,
}: HeaderProps) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const screenWidth = Dimensions.get("window").width;
  const isSmallScreen = screenWidth < 375;
  const logoOuter = isSmallScreen ? 40 : 48;
  const logoInner = logoOuter - LOGO_RING_PADDING * 2;
  const logoRadiusOuter = logoOuter / 2;
  const logoRadiusInner = logoInner / 2;
  const hasHomeWelcome = Boolean(homeWelcome);
  const showInvoiceStrip =
    Boolean(homeWelcome) &&
    homeInvoiceStrip != null &&
    homeInvoiceStrip.kind !== "hidden";

  const goHome = () => {
    const parent = navigation.getParent?.();
    if (parent && typeof parent.navigate === "function") {
      parent.navigate("Main" as never);
      return;
    }
    try {
      navigation.navigate("Main" as never);
    } catch {
      /* ignore */
    }
  };

  return (
    <View style={headerStyles.container}>
      <StatusBar
        barStyle="light-content"
        translucent={false}
        backgroundColor={variant === "water" ? waterHeaderGradient[0] : brandGradient[0]}
      />
      <LinearGradient
        colors={gradientMaps[variant]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          headerStyles.gradient,
          {
            paddingTop: insets.top + 6,
            paddingBottom: hasHomeWelcome ? (showInvoiceStrip ? 14 : 10) : 18,
          },
          isSmallScreen && { paddingHorizontal: 12 },
        ]}
      >
        {homeWelcome ? (
          <View style={headerStyles.homeHeaderRow}>
            <View style={headerStyles.homeBrandPressable}>
              <View style={headerStyles.homeBrandColumn}>
                {homeWelcome.eyebrow?.trim() ? (
                  <Text style={headerStyles.homeEyebrowInline} numberOfLines={1}>
                    {homeWelcome.eyebrow}
                  </Text>
                ) : null}
                <Pressable
                  onPress={onHomeWelcomeNamePress}
                  disabled={!onHomeWelcomeNamePress}
                  accessibilityRole="button"
                  accessibilityLabel={homeWelcome.helloLine}
                  hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
                  android_ripple={
                    onHomeWelcomeNamePress ? { color: headerOnBrand.ripple } : undefined
                  }
                >
                  <Text
                    style={[
                      headerStyles.homeHelloInline,
                      isSmallScreen && headerStyles.homeHelloInlineCompact,
                    ]}
                    numberOfLines={2}
                  >
                    {homeWelcome.helloLine}
                  </Text>
                </Pressable>
                {homeInvoiceStrip?.kind === "loading" ? (
                  <View style={headerStyles.homeInvoiceStripLoading}>
                    <ActivityIndicator color={headerOnBrand.activityIndicator} size="small" />
                  </View>
                ) : homeInvoiceStrip?.kind === "all_paid" ? (
                  <Text style={headerStyles.homeInvoiceStripAllPaid} numberOfLines={2}>
                    {homeInvoiceStrip.caption}
                  </Text>
                ) : homeInvoiceStrip?.kind === "payable" ? (
                  <View style={headerStyles.homeInvoiceStripPayableWrap}>
                    {onHomeInvoicePress ? (
                      <Pressable
                        onPress={onHomeInvoicePress}
                        accessibilityRole="link"
                        accessibilityLabel={homeInvoiceStrip.caption}
                        android_ripple={{ color: headerOnBrand.ripple }}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
                      >
                        <Text
                          style={[
                            homeInvoiceStrip.urgent
                              ? headerStyles.homeInvoiceStripPayableUrgent
                              : headerStyles.homeInvoiceStripPayableMild,
                            headerStyles.homeInvoiceStripPayableUnderline,
                          ]}
                          numberOfLines={3}
                        >
                          {homeInvoiceStrip.caption}
                        </Text>
                      </Pressable>
                    ) : (
                      <Text
                        style={
                          homeInvoiceStrip.urgent
                            ? headerStyles.homeInvoiceStripPayableUrgent
                            : headerStyles.homeInvoiceStripPayableMild
                        }
                        numberOfLines={3}
                      >
                        {homeInvoiceStrip.caption}
                      </Text>
                    )}
                  </View>
                ) : null}
              </View>
            </View>

            {showNotification ? (
              <Pressable
                style={[
                  headerStyles.notificationBtn,
                  headerStyles.notificationBtnHome,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t("common.a11y_notifications")}
                onPress={() => (navigation as any).navigate("NotificationScreen")}
                android_ripple={{ color: headerOnBrand.ripple }}
              >
                <Icons.notification color={headerOnBrand.fg} size={20} />
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View
            style={[
              headerStyles.headerRow,
              isSmallScreen && { gap: 8 },
            ]}
          >
            <Pressable
              style={headerStyles.brandRow}
              onPress={onBrandPress ?? goHome}
              accessibilityRole="button"
              accessibilityLabel={
                onBrandPress
                  ? t("common.a11y_open_profile")
                  : t("common.a11y_brand_go_home")
              }
              android_ripple={{ color: headerOnBrand.ripple }}
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
                  accessibilityLabel={t("common.a11y_app_logo")}
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
            </Pressable>

            <View style={{ flex: 1 }} />

            {showNotification ? (
              <Pressable
                style={headerStyles.notificationBtn}
                accessibilityRole="button"
                accessibilityLabel={t("common.a11y_notifications")}
                onPress={() => (navigation as any).navigate("NotificationScreen")}
                android_ripple={{ color: headerOnBrand.ripple }}
              >
                <Icons.notification color={headerOnBrand.fg} size={24} />
              </Pressable>
            ) : null}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

export default Header;
