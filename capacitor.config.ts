import type { CapacitorConfig } from "@capacitor/cli";

/**
 * IMPORTANT: there is deliberately NO `server.url` here.
 *
 * A `server.url` makes the native app a thin browser pointed at the website —
 * with no internet it shows "ERR_INTERNET_DISCONNECTED" before any of our code
 * runs. The app must always boot from the bundled copy in `native/www`.
 */
const config: CapacitorConfig = {
  appId: "com.smartymove.app",
  appName: "SmartyMove",
  webDir: "native/www",
  android: { allowMixedContent: false },
  ios: { contentInset: "always" },
  server: {
    androidScheme: "https",
    iosScheme: "https",
    cleartext: false,
  },
  plugins: {
    CapacitorHttp: { enabled: false },
  },
};

export default config;