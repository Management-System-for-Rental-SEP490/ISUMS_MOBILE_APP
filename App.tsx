import { SafeAreaProvider } from "react-native-safe-area-context";
import Navigation from './src/navigation/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
        <Navigation />
    </SafeAreaProvider>
  );
}
