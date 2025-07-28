import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";
import { useAppStore } from "@/store";

import * as Updates from "expo-updates";
import { useEffect } from "react";

useEffect(() => {
  async function checkForUpdates() {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  }

  checkForUpdates();
}, []);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { initializeApp, isInitialized, error } = useAppStore();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

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
    console.error('Database initialization error:', error);
    // You could show an error screen here
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="sale/[id]"
          options={{ title: "Sale Details", headerBackTitle: "Back" }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
