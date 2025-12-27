import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Icons from './src/theme/icon';
export default function App() {
  return (
    <View style={styles.container}>
      <Text>my capstone project</Text>
      <View style={{flexDirection: 'row', gap: 10}}>
      <Icons.home />
      <Icons.user />
      <Icons.menu />
      <Icons.water />
      <Icons.electric />
      <Icons.contract />
      <Icons.brain />
      </View>
      
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems:'flex-start',
    justifyContent: 'center',
  },
});
