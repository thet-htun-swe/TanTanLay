import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_KEY. Copy .env.example to .env and fill it in.",
  );
}

// Web pages are pre-rendered in Node, which may have no WebSocket. Live updates
// never run there, so give it a stand-in. Phones and browsers use the real one.
class NoWebSocket {
  constructor() {
    throw new Error("WebSocket is not available here");
  }
}
const realtimeOptions =
  typeof WebSocket === "undefined"
    ? { transport: NoWebSocket as unknown as typeof WebSocket }
    : undefined;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: realtimeOptions,
  auth: {
    // AsyncStorage needs `window` on web; during static rendering there is none
    storage:
      Platform.OS === "web" && typeof window === "undefined"
        ? undefined
        : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Keep the login fresh only while the app is open (Supabase Expo guide)
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
