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
import { useAppStore } from "@/store";

import * as Updates from "expo-updates";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? "light"];
  const { initializeApp, isInitialized, error } = useAppStore();
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
      initializeApp();
    }
  }, [loaded, initializeApp]);

  if (!loaded || !isInitialized) {
    // Show loading while fonts and database are initializing
    return null;
  }

  if (error) {
    // Handle database initialization error
    console.error("Database initialization error:", error);
    // You could show an error screen here
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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="sale/[id]"
          options={{ title: "Sale Details", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="product/[id]/index"
          options={{ title: "Edit Product", headerBackTitle: "Back" }}
        />
        <Stack.Screen
          name="product/create/index"
          options={{ title: "Create Product", headerBackTitle: "Back" }}
        />
        <Stack.Screen name="printer-settings" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
