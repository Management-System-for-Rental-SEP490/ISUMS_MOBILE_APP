// Welcome to screens

import { Text, View } from "react-native";
import Footer from "../components/footer";
import { homeStyles } from "../styles/homeScreen/homeStyles";

const Home = () => (
    <View style={homeStyles.container}>
        <Text>Home</Text>
        <Footer/>
    </View>
)
export default Home;

