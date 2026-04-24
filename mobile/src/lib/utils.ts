import { StyleProp, TextStyle, ViewStyle, ImageStyle } from 'react-native';

type Style = StyleProp<ViewStyle | TextStyle | ImageStyle>;

// A simple utility to combine React Native styles, similar to how clsx or classnames work for web.
// Later styles in the array will override earlier ones.
export function cn(...inputs: Style[]): Style {
  return inputs.flat().filter(Boolean) as Style;
}
