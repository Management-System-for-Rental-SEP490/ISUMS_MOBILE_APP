import FontAwesome from '@expo/vector-icons/FontAwesome';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export type IconProps = {
  size?: number;
  color?: string;
};

const Icons = {
  home: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <AntDesign name="home" size={size} color={color} />
  ),
  user: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome name="user" size={size} color={color} />
  ),
  menu: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <AntDesign name="menu" size={size} color={color} />
  ),
  water: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="hand-holding-water" size={size} color={color} />
  ),
  electric: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <MaterialIcons name="electrical-services" size={size} color={color} />
  ),
  contract: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="file-contract" size={size} color={color} />
  ),
  brain: ({ size = 24, color = 'black' }: IconProps = {}) => (
    <FontAwesome5 name="brain" size={size} color={color} />
  ),
};

export default Icons;