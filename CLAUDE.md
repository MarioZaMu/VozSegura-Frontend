# Voz Segura — Frontend (PWA)

Course case study for "Diseño de Interfaces de Software". Silent panic button: a discreet
double tap on a watch face starts audio recording and sends the location to trusted
contacts, with nothing visible on screen and no sound. It runs as a PWA: on PC it shows
a smartwatch mockup; installed on an Android phone it runs full screen as if the phone
were a watch.

Backend lives in a separate repo: `../VozSegura-backend` (github.com/MarioZaMu/VozSegura-backend).

## Working rules

- **Language:** all code (identifiers, files, comments, commits) in English. Everything
  the user sees in Spanish. Public URL paths are user-visible, so they are in Spanish.
- Work in phases; explain before, report after (how to test on PC and phone) and wait
  for approval. Each phase ends with `npm run build` + `npm run lint` clean and several
  small commits. Never push unless asked.
- Commits authored as MarioZaMu only, no `Co-Authored-By` trailers.
- Keep this file updated with every decision.

## Commands

```bash
npm install        # install dependencies
npm run dev        # dev server at http://localhost:5173
npm run build      # type-check (tsc -b) + production build into dist/
npm run lint       # oxlint
npm run preview    # serve dist/ locally
```

## Stack

React 19 + Vite 8 + TypeScript 6 + Tailwind CSS v4 + React Router 8. Lint with oxlint.
Deployed on Vercel (git integration; every push to `main` deploys). `vercel.json`
rewrites every path to `index.html` so client routes survive a reload.

## Structure

```
src/
  app/        router, route paths, root layout
  components/ ui/ (generic base components), watch/ (mockup and screen)
  views/      one folder per view: watch/, settings/, contact/
  lib/        framework-free helpers (config, storage, api…)
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
- **Known limitation:** the PWA must stay in the foreground; if the phone locks, the
  browser may stop recording/location. Screen Wake Lock API keeps it on.

## Phases

1. ✅ Setup: repos, Vite + React + TS + Tailwind, structure, routes, docs
2. ✅ Design system: tokens, typography, base components, watch mockup round/square
3. Idle watch face, full-screen watch mode on phone, demo mode switch
4. Double-tap detection (accidental-tap prevention) + discreet vibration
5. Active state: real audio + location, without revealing anything
6. Settings: contacts, message, gesture practice, history
7. Backend: alert endpoint, storage, AI transcription/summary, Vercel deploy
8. Contact view + link delivery; "generando resumen…" state
9. Silent confirmation and cancel / false alarm
10. Installable PWA, demo polish, pixel perfect, usability tests (PC + Android)
