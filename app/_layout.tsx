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
import { LoadingScreen } from "@/components/LoadingScreen";
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
    return <LoadingScreen />;
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
          <Stack.Screen
            name="settings/index"
            options={{ title: "Settings", headerBackTitle: "Back" }}
          />
          <Stack.Screen
            name="settings/printer"
            options={{ title: "Printer & receipt", headerBackTitle: "Back" }}
          />
          <Stack.Screen
            name="customer/create/index"
            options={{ title: "Create Customer", headerBackTitle: "Back" }}
          />
          <Stack.Screen
            name="customer/[id]/edit"
            options={{ title: "Edit Customer", headerBackTitle: "Back" }}
          />
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
            {/* Staff accounts (the server function also checks admin) */}
            <Stack.Screen
              name="settings/users/index"
              options={{ title: "Staff accounts", headerBackTitle: "Back" }}
            />
            <Stack.Screen
              name="settings/users/new"
              options={{ title: "Add account", headerBackTitle: "Back" }}
            />
            <Stack.Screen
              name="settings/users/[id]"
              options={{ title: "Edit account", headerBackTitle: "Back" }}
            />
          </Stack.Protected>
        </Stack.Protected>
        {/* Open signed in or out (helps when sign-in does not work) */}
        <Stack.Screen
          name="connection-check"
          options={{ title: "Check connection", headerBackTitle: "Back" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      {isSignedIn && <ReceiptTextRenderer />}
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
