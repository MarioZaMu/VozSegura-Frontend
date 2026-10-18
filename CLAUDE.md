# Voz Segura — Frontend (PWA + Android app)

Course case study for "Diseño de Interfaces de Software". Silent panic button: a discreet
double tap on a watch face starts audio recording and sends the location to trusted
contacts, with nothing visible on screen and no sound. One React app, three targets:
on PC (browser) it shows a smartwatch mockup; on the phone it is an **Android app built
with Capacitor** (`android/`) that runs full screen as if the phone were a watch; the
trusted contact opens the alert page as a regular website.

Backend lives in a separate repo: `../VozSegura-backend` (github.com/MarioZaMu/VozSegura-backend).

## Working rules

- **Language:** all code (identifiers, files, comments, commits) in English. Everything
  the user sees in Spanish. Public URL paths are user-visible, so they are in Spanish.
- Work in phases; explain before, report after (how to test on PC and phone) and wait
  for approval. Each phase ends with `npm run build` + `npm run lint` + `npm test` clean and several
  small commits. Never push unless asked.
- Commits authored as MarioZaMu only, no `Co-Authored-By` trailers.
- Keep this file updated with every decision.

## Commands

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:5173
npm run build      # type-check (tsc -b) + production build into dist/
npm run lint       # oxlint
npm test           # Vitest unit tests (npm run test:watch while developing)
npm run preview    # serve dist/ locally

# Android app (Capacitor)
npm run android:sync     # web build + copy into android/ (run after any web change)
npm run android:build    # debug APK → android/app/build/outputs/apk/debug/app-debug.apk
npm run android:install  # adb install -r on the phone connected by USB
```

`scripts/android.mjs` builds with **JDK 21** (`C:\Program Files\Java\jdk-21.0.12`):
Gradle 8.14 / AGP 8.13 (Capacitor 8) fail on Java 25 ("Unsupported class file major
version 69"), and both the global `JAVA_HOME` (Adoptium 25) and Android Studio's JBR are
Java 25, so the script ignores `JAVA_HOME`. Override with `ANDROID_JAVA_HOME`. The SDK
defaults to `%LOCALAPPDATA%\Android\Sdk`; `android/local.properties` (git-ignored)
holds `sdk.dir`.

## Stack

React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4 + React Router 8. Lint with oxlint,
tests with Vitest. Maps with Leaflet + OpenStreetMap. Android app with Capacitor 8 (`@capacitor-community/keep-awake`,
`@capacitor/share` + local `DiscreetHaptics` and `AlertCapture` plugins).
Deployed on Vercel (git integration; every push to `main` deploys). `vercel.json`
rewrites every path to `index.html` so client routes survive a reload.

## Structure

```
src/
  app/        router, route paths, root layout
  components/ ui/ (generic base components), watch/ (mockup and screen)
  features/   domain logic + UI: settings/ (persisted store), watch/ (display mode),
              watch-face/ (idle face + simulated data)
  views/      one folder per view: watch/, settings/, contact/
  lib/        framework-free helpers (config, storage, platform, haptics, keep-awake…)
android/      Capacitor Android project (committed; build outputs are git-ignored)
scripts/      android.mjs (build/install the APK)
  styles/     index.css with Tailwind @theme design tokens
```

## Routes

| Path               | View             | Who uses it                        |
| ------------------ | ---------------- | ---------------------------------- |
| `/`                | WatchView        | The person at risk (watch)         |
| `/configuracion`   | SettingsView     | Companion app: contacts, history…  |
| `/alerta/:alertId` | ContactAlertView | The trusted contact who got a link (`demo` = simulated) |
| `/sistema-diseno`  | DesignSystemView | Style guide (dev + case study)     |

## Design system

Living style guide at `/sistema-diseno` (DesignSystemView).

Tokens live in `src/styles/index.css` inside `@theme` (Tailwind v4 has no
`tailwind.config.js`; `@theme` is its equivalent). Tailwind's default colors, font
sizes, radii, shadows and easings are **reset** (`--color-*: initial`…), so only our
tokens exist as classes. Never use arbitrary values (`[..]`) in components.

- **Brand colors** (Settings, Contact): `background` #0B0613, `surface` #1A1225,
  `surface-raised` #2A2236, `primary` #C026D3, `gradient-from/to` #D946EF → #8B5CF6
  (utilities `bg-brand-gradient`, `text-brand-gradient`), `text-primary` #FFF,
  `text-secondary` #9A93A8, `danger` #E53935.
- **Watch colors** (idle + active face, neutral on purpose): `watch-face` #000,
  `watch-text`, `watch-muted`, `watch-track`, `watch-activity` (muted green).
  The idle and active states must look like an ordinary watch: never brand magenta there.
- **Device colors** (PC mockup only): `device-case`, `device-bezel`, `device-strap`,
  `device-highlight`.
- **Type:** Poppins self-hosted via `@fontsource/poppins` (works offline in the classroom).
  Scale `caption · body-sm · body · title · headline · display`. Watch text uses
  container-query units (`text-watch-time/date/label`, in `cqi`) so it scales with the
  watch screen, which is an `@container`.
- **Spacing:** Tailwind's 4px scale plus `touch` (48px min target), `gutter`, `section`,
  `watch-screen` (20rem, shrinks on narrow screens), `content`.
- **Radius:** `sm md lg card full`, `watch-square` (22%). **Shadow:** `card glow device`.
- **Motion:** `ease-out-soft`, `ease-in-out-soft`, `animate-fade-in`, `animate-screen-in`;
  `prefers-reduced-motion` disables animations.
- **Icons:** lucide-react (line icons).

Components: `components/ui/` Button (primary/secondary/danger/ghost, ≥48px), Card,
ProgressRing (brand/watch/danger tones, 0–1 value), SegmentedControl;
`components/watch/` WatchDevice (PC mockup), WatchScreen (the display, reused full
screen on the phone), `watchShape.ts` (round | square).

## Decisions

- **PWA instead of Wear OS** (Android attempt discarded; still in git history).
- **Capacitor Android app on top of the PWA** (decided 2026-10-17, phase 5). In the
  browser the vibration was accepted by Chrome but not felt on the phone, and recording
  would stop with the screen locked. The app reuses all the React code and adds native
  haptics, keep-awake and (phase 6) a foreground service so recording and location keep
  going with the screen locked.
- **Contacts notified by a Telegram bot from the backend.** A prefilled WhatsApp/SMS link
  or Web Share needs the user to tap "send", which breaks the invisible interaction.
  A prefilled WhatsApp link stays only as a manual fallback in the history.
- **Alert in two requests:** `POST /api/alerts` with location only (stored + Telegram
  sent + link returned), then the audio upload triggers transcription/summary. The AI
  can never delay or block the alert.
- **Demo mode** simulates mic, location, AI and sending; it is built early (phase 3), not
  at the end, because the presentation depends on it.
- **Phone testing over HTTPS:** mic and geolocation need a secure context, so the phone
  uses the Vercel URL.
- **Known limitation (browser only):** the PWA must stay in the foreground; if the phone
  locks, the browser may stop recording/location. The Wake Lock API keeps the screen on.
  The Android app does not have this limitation.

## Watch view behavior

- **Display mode** (`useWatchDisplayMode`): always `fullscreen` in the Android app
  (`isNativeApp()` in `lib/platform.ts`); in the browser `fullscreen` when installed (display-mode
  standalone/fullscreen) or on a phone-sized touch screen (`pointer: coarse` and
  ≤640px); otherwise `mockup`. Override with `?vista=reloj` or `?vista=mockup`.
- **Full screen:** black background, the watch screen as the largest circle/square that
  fits (`size-watch-fullscreen`) with a faint outline, status bar painted black via
  `theme-color`, and no navigation at all.
- **Mockup (PC):** device mockup plus a card with shape selector and demo-mode switch.
- **Keep awake** (`lib/useKeepAwake.ts`) while the full-screen watch is shown: native
  KeepAwake in the app, Screen Wake Lock API in the browser.
- **Debug on the phone browser:** `?debug=1` shows `MobileDebugPanel` above the watch
  (touch size, vibration test, gesture log). In the app use `chrome://inspect` from the PC.
- **Idle face** (`WatchFace`): time (24 h), Spanish date, temperature, steps ring and heart
  rate. Data is simulated and deterministic per minute (`simulatedWatchData.ts`).

## Panic gesture (double tap activates, triple tap stops)

`features/gesture/doubleTapDetector.ts` is framework-free and unit tested
(`doubleTapDetector.test.ts`). Defaults: second tap ≤350 ms after the first is released
and ≥40 ms (faster = bounce or synthetic), each tap ≤300 ms, taps ≤40 px apart, finger
movement ≤12 px, contact ≤60 px (bigger = palm). Rejections with a reason:
`not-armed` (first 800 ms after the screen is shown — pocket wake-ups), `cooldown`
(2 s after a double tap, so a triple tap cannot re-trigger), `multi-touch`, `palm`,
`moved`, `long-press`, `too-fast`, `too-far`. A browser `pointercancel` never counts.

**Triple tap (phase 10):** a third valid tap within the same timing/distance rules right
after a double tap emits `triple-tap` (it is the one tap allowed through the cooldown).
`WatchView` passes `stopAlertFromGesture` (alertSessionStore) as `usePanicGesture`'s
`onTripleTap`: it stops the active alert only once it is ≥3 s old
(`MIN_ALERT_AGE_TO_STOP_MS`, so a stray triple tap cannot activate and cancel at once), or
the Android service's alert when the app was reopened mid-alert. When it stops something
the phone vibrates `hapticPatterns.stopped` (two short pulses); otherwise nothing happens.

- `useDoubleTap` wires it to pointer events and re-arms on `visibilitychange`.
- `usePanicGesture` adds the confirmation: `vibrate(hapticPatterns.confirm)` (80 ms; 35 ms
  was accepted but not felt on a real phone — motors need ~50 ms to spin up). `lib/haptics.ts`
  uses the local `DiscreetHaptics` plugin in the app and `navigator.vibrate` in the browser;
  when the device cannot vibrate (iPhone) — and always in the PC mockup — the face does a
  barely visible blink (`animate-subtle-blink`, opacity dip to 0.72).
- The watch view puts a `touch-manipulation` layer (`TouchSurface`) over the screen so the
  browser never zooms on double tap.
- PC only: `GestureDiagnostics` lists the last 6 touches and how they were interpreted
  (Spanish labels in `gestureLabels.ts`, reused later by the practice view).
- Automated browser clicks fire ~27 ms apart and are correctly rejected as `too-fast`;
  test with real taps or dispatched PointerEvents with human timing.

## Alert capture (active state)

`features/alert/`:

- `alertCapture.ts`: the `AlertCapture` contract (`start(options, listener)` / `stop()`)
  and its events (`started`, `location`, `chunk`, `error`, `stopped`). Defaults: 20 s
  audio chunks, 5 min max.
- `alertSession.ts` (+ tests): pure reducer. A second activation while active is ignored;
  one source failing never stops the other; after `stopped` only the flushed last chunk is
  accepted.
- `alertSessionStore.ts`: module store (`activateAlert`, `stopAlert`, `useAlertSession`).
  Picks the implementation: **demo** when `demoMode`, **native** in the Android app,
  **web** otherwise. `alertId` = `crypto.randomUUID()`.
- `demoCapture.ts`: simulated location drifting around Medellín every 5 s and fake chunks.
- `webCapture.ts`: `watchPosition` first, then one `MediaRecorder` per chunk (each file is
  playable on its own; `timeslice` pieces are not).
- `nativeCapture.ts`: wraps the local `AlertCapture` plugin; `check/ensureNativeCapturePermissions`
  are used only from Settings (never at the moment of the alert: a dialog then would give
  the gesture away).
- `alertHistory.ts`: local list (20 max, `voz-segura:alert-history:v1`) of alerts raised on
  this device, recorded in `activateAlert`; shown in Settings with links to `/alerta/:id`.
- `AlertDiagnostics.tsx`: PC-only panel (status, elapsed time, sources, last fix, chunks,
  delivery, errors, "Detener"). **The watch face never changes when an alert starts.**

Delivery to the backend (phase 8):

- `alertApi.ts`: `postAlert`, `postLocation` (no retry), `postAudioChunk` (raw body),
  `postStop(totalChunks)`; retries network errors/5xx with backoff, never 4xx.
- `webDelivery.ts`: wraps the browser capture listener: alert first, a position every
  10 s, chunks uploaded one by one in order, stop last. Reports `delivery` events.
- The Android service does the same in Java (`AlertUploader.java`), because JS pauses with
  the screen off. JS only passes `apiBaseUrl`, `apiToken`, `deviceId` and `startedAt` in the start options.
- `lib/deviceId.ts`: random UUID per phone/browser (`voz-segura:device-id:v1`), sent with
  every alert (`postAlert` and the native uploader) so the backend notifies that device's
  confirmed contacts. No user accounts.
- **Demo mode never sends anything**; real alerts need `VITE_API_BASE_URL` and
  `VITE_ALERT_API_TOKEN` (`isBackendConfigured()` in `lib/config.ts`). Local values live
  in the git-ignored `.env.local`; the token is public once built (inside the bundle/APK).

Android side (`android/app/src/main/java/com/mariozamu/vozsegura/`):

- `AlertCapturePlugin.java`: `start/stop/getStatus/flushPending` + Capacitor permission aliases
  `microphone` and `location`; service events reach JS as retained `captureEvent`s.
- `AlertUploader.java`: two single-thread queues (alert → chunks → stop in order;
  positions apart so they never wait behind audio), `HttpURLConnection`, ~2 min of retries
  per item, **deletes each chunk file once uploaded**. The service stays in the foreground
  ("draining") until the stop is sent (max 4 min), and sends the alert even with no
  permissions at all.
- `AlertCaptureService.java`: foreground service typed `microphone|location` (only the
  types whose permission is granted, Android 14 rule), partial wake lock, AAC 16 kHz mono
  32 kbps in `files/alerts/{alertId}/chunk-NNN.m4a` (one MediaRecorder per chunk), fused
  location every 10 s (`play-services-location`), self-stop at max duration (JS may be
  paused with the screen off). The mandatory notification is "Sincronizando…" on an
  `IMPORTANCE_MIN` channel; the app never asks for `POST_NOTIFICATIONS`, so on Android
  13+ it is not shown.
- `PendingAlerts.java` (phase 10): the service keeps `meta.json` next to the chunks
  (startedAt, deviceId, finished chunk durations, totalChunks, stopReason, stopSent). On
  app start, with a backend configured, `alertSessionStore` calls `flushPending`: each
  leftover folder (except the one still in use, `busyAlertId`) gets its finished chunks
  uploaded, then the stop, and is deleted. Half-written chunks (app killed mid-recording)
  are dropped; folders older than 24 h are deleted unsent. Logcat tag `PendingAlerts`.
- Demo mode defaults to **off in the app** and on in the browser; both can change it in
  Settings.
- `res/xml/network_security_config.xml`: HTTPS only, except `localhost`/`127.0.0.1` for a
  local backend over USB (`adb reverse tcp:3100 tcp:3100`).
- Logs: `adb logcat -s AlertCapture AlertUpload PendingAlerts` (HyperOS floods logcat; read it soon). Files:
  `adb shell run-as com.mariozamu.vozsegura ls -l files/alerts/`.

## Settings store

`features/settings/settingsStore.ts`: module-level store + `useSyncExternalStore`,
persisted in localStorage (`voz-segura:settings:v1`) through the safe helpers in
`lib/storage.ts`, and synced across tabs with the `storage` event. Fields:
`demoMode` (default **on** in the browser, so the classroom demo works out of the box;
off in the Android app), `watchShape` and `onboarded` (Android app: Settings opens on
launch until "Ir al reloj" is pressed once).

## Settings view (phase 7)

`views/settings/`: one card per section, all in Spanish.

- **ContactsSection** (+ `useContacts`): add a name → `POST /api/contacts` → share
  `t.me/VSegurabot?start=<code>` with `lib/share.ts` (`@capacitor/share` in the app, Web
  Share API, else clipboard). Chips Pendiente / Confirmado / Se dio de baja. The list
  refreshes on focus/visibility and every 5 s while an invite is pending, so the status
  flips by itself when the contact taps "Iniciar". Invite links only come back on create,
  so a pending contact without a known link gets "Nuevo enlace" (`PUT`, replaces it).
  Max 10 contacts. Without confirmed contacts the backend uses `DEFAULT_CHAT_IDS`.
- **ProfileSection**: owner name (40) and personal message (280), shown in the Telegram alert.
- **PermissionsSection** (`features/settings/capturePermissions.ts`): mic + location state
  (native plugin or `navigator.permissions`) and "Conceder permisos"; in the browser the
  prompt is triggered by briefly opening the mic and asking for one position.
- **PracticeSection**: same `usePanicGesture` (detector + vibration) on a small screen, but
  `onActivate` only counts. Never raises an alert.
- Demo-mode switch, **HistorySection**, and "Ir al reloj" (sets `onboarded`).
- **AlertControlSection** (phase 10, top of the page): while an alert is recording (this
  session or the Android service's) shows "Detener alerta"; while it runs or for 24 h after
  the last alert, "Avisar que estoy bien" / "Fue una falsa alarma" (stops first if needed,
  then `postResolve` → `POST /api/resolve`; demo alerts only mark it locally). The answer
  is kept in the history entry (`resolution`) and the card turns into a confirmation.
- `features/settings/settingsApi.ts`: client for `/api/device` and `/api/contacts`.
- **Hidden entry:** on the watch a 2 s still press (`features/gesture/useLongPress.ts`,
  12 px tolerance) opens Settings; the double-tap detector already rejects long presses,
  so both share the touch layer (`useWatchGestures` in `WatchView`). Nothing on the watch
  hints at it. In the app the nav only shows Reloj and Configuración.
- Local testing against the local backend: `npm run dev -- --mode localapi` with a
  git-ignored `.env.localapi.local` (`VITE_API_BASE_URL=http://localhost:3100`); the
  backend's `ALLOWED_ORIGIN` must match the Vite port.

## Contact view (phase 9)

`/alerta/:alertId` — the page the trusted contact opens from the Telegram link (also from
the owner's alert history). Loaded lazily by the router (it carries Leaflet). Without the
app navigation for real alerts; `/alerta/demo` keeps it for the presentation.

- `features/contact/alertView.ts` (+ tests): `fetchAlertView` (`GET /api/alert?id`, public),
  types, and pure helpers: `isFinal` (stopped + summary ready/error + no pending
  transcripts, or stopped with no audio for 2 min; and resolved, or 15 min since the stop,
  so a later "estoy bien" still shows up), `formatAgo`, `chunkRange`,
  `directionsUrl`, `ownerLabel` ("Tu contacto" when no name).
- `useAlertView`: polls every 5 s until `isFinal`; pauses while the tab is hidden; on a
  failed refresh keeps the last data and shows "Sin conexión". `demo` → `demoAlertView`.
- `demoAlertView.ts`: deterministic simulated alert ("Laura", El Poblado) that starts 40 s
  before the page opened: positions every 5 s, 20 s chunks transcribed 6 s later, a
  summary that goes "Generando…" → partial → final, stop at second 100, and "estoy bien"
  at second 135.
- Resolution (phase 10): green "Está bien" badge + banner, or "Falsa alarma", right under
  the title.
- `views/contact/`: `ContactAlertView` (header with live/finished badge, owner message,
  location card with "Cómo llegar" (Google Maps directions) and "Llamar al 123", summary
  card with "Generando resumen…" / partial / final + AI disclaimer, audio card with one
  `<audio preload="none">` and transcript per chunk) and `AlertMap` (Leaflet: trail,
  accuracy circle, pulsing marker while active; follows the latest fix until the contact
  drags the map; no wheel zoom so the page scrolls).
- Map tiles: standard OpenStreetMap darkened with a CSS filter (`.map-dark` in index.css,
  unlayered because Leaflet's CSS is unlayered). CARTO's dark tiles now require an API key.
- Audio cannot be tested locally (dev backend cannot read Blob, see backend CLAUDE.md);
  against production the `<audio>` loads (checked: 19.9 s chunk).
- Known: Whisper hallucinates "Gracias." on silent chunks (phone in a pocket); the summary
  prompt ignores it, the per-chunk transcript still shows it.

## Android app

- appId `com.mariozamu.vozsegura`, name "Voz Segura" (a discreet name/icon is a phase 11
  decision), `webDir: dist` (`capacitor.config.ts`).
- `MainActivity.java` hides status and navigation bars (immersive; swipe shows them
  briefly). Manifest locks portrait. Launch screen and window background are black; the
  launcher icon is a neutral watch face vector (`res/drawable/ic_launcher_watch.xml`).
- **`DiscreetHapticsPlugin.java`** (local plugin, registered in `MainActivity`) vibrates
  with `USAGE_ALARM`. Logcat on the user's Xiaomi showed both Chrome and
  `@capacitor/haptics` vibrations (`USAGE=TOUCH`) ending `IGNORED_FOR_SETTINGS` because touch
  vibration is off in the phone settings; a panic confirmation must not depend on that.
- After web changes run `npm run android:sync` before building the APK.
- Test phone: Redmi Note 13 Pro (23117RA68G, HyperOS). Logs:
  `adb logcat | grep -iE "Capacitor|VibratorManagerService"`.
- `@capacitor/cli` brings 3 moderate npm audit findings (dev-only tooling, not shipped).

## Phases

1. ✅ Setup: repos, Vite + React + TS + Tailwind, structure, routes, docs
2. ✅ Design system: tokens, typography, base components, watch mockup round/square
3. ✅ Idle watch face, full-screen watch mode on phone, demo mode switch
4. ✅ Double-tap detection (accidental-tap prevention) + discreet vibration
5. ✅ Android app with Capacitor: immersive watch, native haptics, keep-awake, APK scripts
6. ✅ Active state: real audio + location (web + native foreground service), without revealing anything
7. ✅ Settings: contacts by Telegram invite, message, permissions up front, gesture practice, history
8. ✅ Backend: alert endpoint, storage, AI transcription/summary, Telegram, Vercel deploy
9. ✅ Contact view: live map, AI summary ("generando resumen…"), audio + transcripts, demo
10. ✅ Triple tap to stop, "estoy bien" / false alarm, leftover audio resent on app open
11. Installable PWA + final APK, demo polish, pixel perfect, usability tests (PC + Android)

