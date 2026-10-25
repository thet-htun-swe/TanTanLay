import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";

/** Same colour as the native splash screen (app.json), so there is no flash between them. */
export const SPLASH_BACKGROUND = "#4F3590";

/** Shown while fonts, the saved login and shop data load (replaces a blank/black screen). */
export function LoadingScreen({ message }: { message?: string }) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="KHA"
      />
      <View style={styles.status}>
        <ActivityIndicator size="small" color="#D6C4FF" />
        {message ? <Text style={styles.message}>{message}</Text> : null}
      </View>
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
  status: {
    position: "absolute",
    bottom: 80,
    alignItems: "center",
    gap: 10,
  },
  message: { color: "#D6C4FF", fontSize: 15 },
});
