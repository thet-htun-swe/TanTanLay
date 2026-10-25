import { ActivityIndicator, Image, StyleSheet, View } from "react-native";

/** Same colour as the native splash screen (app.json), so there is no flash between them. */
export const SPLASH_BACKGROUND = "#4F3590";

/** Shown while fonts, the saved login and shop data load (replaces a blank/black screen). */
export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="KHA"
      />
      <ActivityIndicator
        style={styles.spinner}
        size="small"
        color="#D6C4FF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 260, height: 130 },
  spinner: { position: "absolute", bottom: 80 },
});
