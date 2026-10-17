import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "expo-router/react-navigation";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ReceiptTextRenderer } from "@/components/ReceiptTextRenderer";
import { useAppStore, useIsAdmin } from "@/store";

import * as Updates from "expo-updates";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { initializeApp, isInitialized, initAuth, authReady, session } =
    useAppStore();
  const isSignedIn = !!session;
  const isAdmin = useIsAdmin();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    async function checkForUpdates() {
      if (!Updates.isEnabled) return;

      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (error) {
        console.warn("Update check failed:", error);
      }
    }

    checkForUpdates();
  }, []);

  useEffect(() => {
    if (loaded) {
      initAuth();
    }
  }, [loaded, initAuth]);

  useEffect(() => {
    if (loaded && isSignedIn) {
      initializeApp();
    }
  }, [loaded, isSignedIn, initializeApp]);

  if (!loaded || !authReady || (isSignedIn && !isInitialized)) {
    // Show loading while fonts, saved login and database are loading
    return null;
  }

  return (
    <ThemeProvider value={{
      ...(colorScheme === "dark" ? DarkTheme : DefaultTheme),
      colors: {
        ...(colorScheme === "dark" ? DarkTheme : DefaultTheme).colors,
        primary: theme.tint,
        background: theme.background,
        card: theme.cardBackground,
        text: theme.text,
        border: theme.border,
        notification: theme.danger,
      },
    }}>
      <Stack>
        {/* Signed out: only the login screen can be opened */}
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="sale/[id]"
            options={{ title: "Sale Details", headerBackTitle: "Back" }}
          />
          <Stack.Screen name="printer-settings" options={{ headerShown: false }} />
          {/* Listed only so they are protected too (no option changes) */}
          <Stack.Screen name="customer/create/index" />
          <Stack.Screen name="customer/[id]/edit" />
          {/* Admin only: change products, edit sales */}
          <Stack.Protected guard={isAdmin}>
            <Stack.Screen
              name="product/[id]/index"
              options={{ title: "Edit Product", headerBackTitle: "Back" }}
            />
            <Stack.Screen
              name="product/create/index"
              options={{ title: "Create Product", headerBackTitle: "Back" }}
            />
            <Stack.Screen name="edit-sale/[id]" />
          </Stack.Protected>
        </Stack.Protected>
        <Stack.Screen name="+not-found" />
      </Stack>
      {isSignedIn && <ReceiptTextRenderer />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
