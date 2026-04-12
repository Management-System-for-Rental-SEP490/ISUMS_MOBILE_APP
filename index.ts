import "react-native-gesture-handler";

/**
 * Suppress "topSvgLayout" error from react-native-svg
 * See: https://github.com/software-mansion/react-native-svg/issues/2387
 */
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'Unsupported top level event type "topSvgLayout" dispatched',
  'topSvgLayout',
]);

import { registerRootComponent } from 'expo';

import App from './App';
registerRootComponent(App);
