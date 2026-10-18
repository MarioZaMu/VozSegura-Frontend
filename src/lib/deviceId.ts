import { readJson, writeJson } from './storage'

// Random id of this phone/browser. The backend keys the owner's name, message and contacts
// by it (there are no user accounts). Generated once and kept in localStorage.
const STORAGE_KEY = 'voz-segura:device-id:v1'

let deviceId: string | null = null

export function getDeviceId(): string {
  if (deviceId) return deviceId
  const stored = readJson<string | null>(STORAGE_KEY, null)
  deviceId = stored ?? crypto.randomUUID()
  if (!stored) writeJson(STORAGE_KEY, deviceId)
  return deviceId
}
