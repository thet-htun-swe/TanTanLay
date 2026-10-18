import Constants from "expo-constants";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { supabaseHost } from "@/lib/supabase";
import { useAppStore } from "@/store";

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const signIn = useAppStore((state) => state.signIn);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError(null);
    setIsSigningIn(true);
    try {
      // On success the root layout switches to the app by itself
      await signIn(email, password);
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Could not sign in. Please try again.",
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <ThemedText type="title">
              {Constants.expoConfig?.name ?? "Sign in"}
            </ThemedText>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Sign in to continue
            </Text>
          </View>

          <Card style={styles.card}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              editable={!isSigningIn}
              containerStyle={styles.field}
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSignIn}
              editable={!isSigningIn}
              containerStyle={styles.field}
            />

            {error && (
              <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
            )}

            <Button
              title={isSigningIn ? "Signing in..." : "Sign in"}
              onPress={handleSignIn}
              disabled={isSigningIn}
            />
          </Card>

          <Text style={[styles.hint, { color: theme.muted }]}>
            No account? Ask the shop admin to create one for you.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/connection-check")}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={[styles.checkLink, { color: theme.tint }]}>
              Trouble signing in? Check connection
            </Text>
          </TouchableOpacity>
          <Text style={[styles.server, { color: theme.muted }]}>Server: {supabaseHost}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  card: {
    padding: 20,
  },
  field: {
    marginBottom: 16,
  },
  error: {
    fontSize: 14,
    marginBottom: 16,
  },
  hint: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  checkLink: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  server: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    opacity: 0.8,
  },
});
