import type { CapacitorConfig } from '@capacitor/cli'

// Android app that wraps the same React build (dist/). See CLAUDE.md → "Android app".
const config: CapacitorConfig = {
  appId: 'com.mariozamu.vozsegura',
  appName: 'Voz Segura',
  webDir: 'dist',
  // Black behind the WebView so app start looks like a watch screen turning on.
  backgroundColor: '#000000',
  android: {
    // No WebView overscroll glow or long-press text selection on the watch.
    allowMixedContent: false,
  },
}

export default config
