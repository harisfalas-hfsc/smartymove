# Native + Offline: universal hardening guide (SmartyMove)

## The 4 root causes of "Error loading page / ERR_INTERNET_DISCONNECTED" in a native app

1. **`server.url` in `capacitor.config.ts`** — the app is a browser pointed at the website. With no internet the WebView fails before any app code runs. Fix: never set `server.url`; always ship a bundled `webDir`.
2. **No bundled entry document** — the site is server-rendered and has no `index.html`. Fix: `scripts/build-native.mjs` emits a static `native/www/index.html` that boots the client bundle from the device.
3. **`navigator.onLine` used as the truth** — native WebViews report `true` with no reachable network and fire no `online`/`offline` events. Fix: one source of truth, `src/lib/offline/connectivity.ts` (Capacitor Network on native, browser events on web).
4. **Session lost on cold start with no network** — Supabase can only restore what is in local storage. Fix: `restoreDeviceSession()` runs at boot and re-seeds the remembered session before anything reads auth.

## Single connectivity source
`src/lib/offline/connectivity.ts` exports `initConnectivity()`, `getOnline()`, `subscribeConnectivity()`, `isNativeApp()`. `useOnlineStatus()` reads it. Never call `navigator.onLine` anywhere else.

## Boot order (`src/routes/__root.tsx`)
`initConnectivity()` → `restoreDeviceSession()` → `registerAppServiceWorker()` (skipped on native).

## Offline auth
`src/lib/offline/device-auth.ts`: PBKDF2-SHA256 verifier + the device's own Supabase session blob. Online sign-in calls `rememberDevice`; offline sign-in calls `offlineSignIn`; cold start calls `restoreDeviceSession`.

## Data layer
IndexedDB (`smartymove-offline`), user-scoped keys, `offlineFirst()` / `useOfflineData()`, eviction-protected member data, `OfflineBootstrap` prefetch on sign-in and every reconnect, `OfflineSync` queue replay.

## Capacitor rules
- `webDir: "native/www"`, no `server.url`, `androidScheme/iosScheme: "https"`, `cleartext: false`.
- Service worker is disabled inside the native shell (`isNativeApp()` guard) — the bundle is already local.

## Build & sync
```
npm run build:native          # web client + native/www shell
npx cap add android           # first time only
npx cap add ios               # first time only
npm run cap:sync              # rebuild + copy into the platform projects
npx cap open android          # then Run
```

## Airplane-mode verification
1. Install the build, sign in once **online**, open Home / Program / Progress / Profile.
2. Kill the app, enable airplane mode, relaunch.
3. Expected: app opens instantly, you stay signed in (or can sign in with the same email/password), past scans, program, records and progress render from the device, payments/scans show the read-only offline notice.

## Store builds
Startup behaviour lives in the binary. Any app already submitted to the App Store / Play Store keeps its old startup path and must be rebuilt and resubmitted with this change.
