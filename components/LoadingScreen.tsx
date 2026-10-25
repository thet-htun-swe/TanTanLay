import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

/** Same colour as the native splash screen (app.json), so there is no flash between them. */
export const SPLASH_BACKGROUND = "#4F3590";
const LIGHT = "#D6C4FF";
const SLOW_AFTER_MS = 10000;

type Props = {
  /** Status line under the spinner, e.g. "Signing in…" */
  message?: string;
  /** Replaces the spinner when loading failed */
  error?: string | null;
  onRetry?: () => void;
  /** Lets the user leave when loading is slow or failed */
  onLogout?: () => void;
};

/** Shown while fonts, the saved login and shop data load (replaces a blank/black screen). */
export function LoadingScreen({ message, error, onRetry, onLogout }: Props) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => {
      clearTimeout(timer);
      setSlow(false);
    };
  }, [error]);

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/splash-icon.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="KHA"
      />
      <View style={styles.status}>
        {error ? (
          <>
            <Text style={styles.error}>{error}</Text>
            <View style={styles.buttons}>
              {onRetry && <ActionButton title="Try again" primary onPress={onRetry} />}
              {onLogout && <ActionButton title="Log out" onPress={onLogout} />}
            </View>
          </>
        ) : (
          <>
            <ActivityIndicator size="small" color={LIGHT} />
            {message ? <Text style={styles.message}>{message}</Text> : null}
            {slow && (
              <>
                <Text style={styles.hint}>
                  This is taking longer than usual. Check your internet connection.
                </Text>
                {onLogout && <ActionButton title="Log out" onPress={onLogout} />}
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}

function ActionButton({
  title,
  onPress,
  primary,
}: {
  title: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.button, primary && styles.buttonPrimary]}
    >
      <Text style={[styles.buttonText, primary && styles.buttonTextPrimary]}>
        {title}
      </Text>
    </Pressable>
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
    left: 24,
    right: 24,
    alignItems: "center",
    gap: 10,
  },
  message: { color: LIGHT, fontSize: 15 },
  hint: { color: LIGHT, fontSize: 13, textAlign: "center", opacity: 0.85 },
  error: { color: "#FFFFFF", fontSize: 15, textAlign: "center" },
  buttons: { flexDirection: "row", gap: 12, marginTop: 6 },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: LIGHT,
  },
  buttonPrimary: { backgroundColor: LIGHT },
  buttonText: { color: LIGHT, fontSize: 15, fontWeight: "600" },
  buttonTextPrimary: { color: SPLASH_BACKGROUND },
});
