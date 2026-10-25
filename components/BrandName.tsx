import { Image, ImageStyle, StyleProp } from "react-native";

import { useColorScheme } from "@/hooks/useColorScheme";

const LOGO_ASPECT = 853 / 317;

type Props = {
  /** Picture height; the default matches the old 32 pt title text */
  height?: number;
  style?: StyleProp<ImageStyle>;
};

/** Shop name "KHA" in the gradient script style (made by scripts/make-splash.py). */
export function BrandName({ height = 44, style }: Props) {
  const dark = useColorScheme() === "dark";
  return (
    <Image
      source={
        dark
          ? require("../assets/images/kha-logo-dark.png")
          : require("../assets/images/kha-logo-light.png")
      }
      style={[{ height, width: height * LOGO_ASPECT }, style]}
      resizeMode="contain"
      accessibilityRole="header"
      accessibilityLabel="KHA"
    />
  );
}
