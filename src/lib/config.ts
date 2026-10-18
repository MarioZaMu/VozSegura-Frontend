// Runtime configuration read from Vite env variables (see .env.example).
// Only public values belong here: anything prefixed with VITE_ ends up in the bundle.
export const config = {
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, ''),
} as const
