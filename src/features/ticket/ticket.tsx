import { SafeAreaProvider } from "react-native-safe-area-context"
import { View, Text } from "react-native"
import { ticketStyles } from "./ticketStyles"

const TicketScreen = () => {
    return (
        <SafeAreaProvider style={ticketStyles.container}>
            <View style={ticketStyles.content}>
                <Text>Ticket</Text>
            </View>
        </SafeAreaProvider>
    );
};

export default TicketScreen;