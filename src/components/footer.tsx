import { View } from "react-native";

import Icons from "../theme/icon";
import homeStyles from "../styles/homeScreen/homeStyles";

const Footer = () => (
  <View style={homeStyles.footer}>
    <Icons.home size={26} color="#1f2937" />
    <Icons.user size={26} color="#1f2937" />
    <Icons.brain size={26} color="#1f2937" />
    <Icons.menu size={26} color="#1f2937" />
  </View>
);

export default Footer;