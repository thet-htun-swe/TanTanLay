import { useEffect, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import {
  attachTextRenderer,
  detachTextRenderer,
  handleTextRendererMessage,
  TEXT_RENDERER_HTML,
} from "@/services/textRaster";

// Hidden WebView that draws Myanmar (and other non-English) receipt lines as
// pictures for the thermal printer. Mounted once in the root layout.
export function ReceiptTextRenderer() {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    attachTextRenderer((script) => webViewRef.current?.injectJavaScript(script));
    return detachTextRenderer;
  }, []);

  // Printing is Android/iOS only; react-native-webview does not run on web
  if (Platform.OS === "web") return null;

  return (
    <View style={styles.hidden} pointerEvents="none">
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: TEXT_RENDERER_HTML }}
        onMessage={(event) => handleTextRendererMessage(event.nativeEvent.data)}
        // A reloaded page reports "ready" again, so mark it not ready meanwhile
        onLoadStart={() =>
          attachTextRenderer((script) => webViewRef.current?.injectJavaScript(script))
        }
        javaScriptEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
    overflow: "hidden",
  },
});
