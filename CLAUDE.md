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
tests with Vitest. Android app with Capacitor 8 (`@capacitor/haptics`,
`@capacitor-community/keep-awake`).
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
| `/alerta/:alertId` | ContactAlertView | The trusted contact who got a link |
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

## Panic gesture (double tap)

`features/gesture/doubleTapDetector.ts` is framework-free and unit tested
(`doubleTapDetector.test.ts`). Defaults: second tap ≤350 ms after the first is released
and ≥40 ms (faster = bounce or synthetic), each tap ≤300 ms, taps ≤40 px apart, finger
movement ≤12 px, contact ≤60 px (bigger = palm). Rejections with a reason:
`not-armed` (first 800 ms after the screen is shown — pocket wake-ups), `cooldown`
(2 s after a double tap, so a triple tap cannot re-trigger), `multi-touch`, `palm`,
`moved`, `long-press`, `too-fast`, `too-far`. A browser `pointercancel` never counts.

- `useDoubleTap` wires it to pointer events and re-arms on `visibilitychange`.
- `usePanicGesture` adds the confirmation: `vibrate(hapticPatterns.confirm)` (80 ms; 35 ms
  was accepted but not felt on a real phone — motors need ~50 ms to spin up). `lib/haptics.ts`
  uses `@capacitor/haptics` in the app and `navigator.vibrate` in the browser;
  when the device cannot vibrate (iPhone) — and always in the PC mockup — the face does a
  barely visible blink (`animate-subtle-blink`, opacity dip to 0.72).
- The watch view puts a `touch-manipulation` layer (`TouchSurface`) over the screen so the
  browser never zooms on double tap.
- PC only: `GestureDiagnostics` lists the last 6 touches and how they were interpreted
  (Spanish labels in `gestureLabels.ts`, reused later by the practice view).
- Automated browser clicks fire ~27 ms apart and are correctly rejected as `too-fast`;
  test with real taps or dispatched PointerEvents with human timing.

## Settings store

`features/settings/settingsStore.ts`: module-level store + `useSyncExternalStore`,
persisted in localStorage (`voz-segura:settings:v1`) through the safe helpers in
`lib/storage.ts`, and synced across tabs with the `storage` event. Fields so far:
`demoMode` (default **on**, so the classroom demo works out of the box) and `watchShape`.

## Android app

- appId `com.mariozamu.vozsegura`, name "Voz Segura" (a discreet name/icon is a phase 11
  decision), `webDir: dist` (`capacitor.config.ts`).
- `MainActivity.java` hides status and navigation bars (immersive; swipe shows them
  briefly). Manifest locks portrait. Launch screen and window background are black; the
  launcher icon is a neutral watch face vector (`res/drawable/ic_launcher_watch.xml`).
- After web changes run `npm run android:sync` before building the APK.
- `@capacitor/cli` brings 3 moderate npm audit findings (dev-only tooling, not shipped).

## Phases

1. ✅ Setup: repos, Vite + React + TS + Tailwind, structure, routes, docs
2. ✅ Design system: tokens, typography, base components, watch mockup round/square
3. ✅ Idle watch face, full-screen watch mode on phone, demo mode switch
4. ✅ Double-tap detection (accidental-tap prevention) + discreet vibration
5. ✅ Android app with Capacitor: immersive watch, native haptics, keep-awake, APK scripts
6. Active state: real audio + location (web + native foreground service), without revealing anything
7. Settings: contacts, message, permissions up front, gesture practice, history
8. Backend: alert endpoint, storage, AI transcription/summary, Telegram, Vercel deploy
9. Contact view + link delivery; "generando resumen…" state
10. Silent confirmation and cancel / false alarm
11. Installable PWA + final APK, demo polish, pixel perfect, usability tests (PC + Android)

Phase 6 plan: an `AlertCapture` interface in `features/alert/` with demo, web
(MediaRecorder chunks + watchPosition + Wake Lock) and native implementations. The native
one is a local Kotlin Capacitor plugin with a `ForegroundService` (microphone|location)
that records in chunks and uploads them straight to the backend, because the WebView's JS
pauses with the screen off. Minimal-importance notification with neutral text.
