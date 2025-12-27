import { View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import Icons from "../theme/icon";
import homeStyles from "../styles/homeScreen/homeStyles";
import { RootStackParamList } from "../types";

const Footer = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={homeStyles.footer}>
      <TouchableOpacity onPress={() => navigation.navigate("Home")}>
        <Icons.home size={26} color="#1f2937" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("User")}>
        <Icons.user size={26} color="#1f2937" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Electric")}>
        <Icons.electric size={26} color="#1f2937" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Water")}>
        <Icons.water size={26} color="#1f2937" />
      </TouchableOpacity>
      <TouchableOpacity>
        <Icons.menu size={26} color="#1f2937" />
      </TouchableOpacity>
    </View>
  );
};

export default Footer;