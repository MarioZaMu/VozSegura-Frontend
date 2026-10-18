import { useSyncExternalStore } from 'react'
import { readJson, writeJson } from '../../lib/storage'
import type { AlertCapture } from './alertCapture'

// Alerts raised on this device, newest first, so the owner can reopen each one's contact
// view from Settings. Only kept locally.

export type AlertHistoryEntry = {
  alertId: string
  startedAt: number
  kind: AlertCapture['kind']
  /** False in demo mode or without a backend: nobody was notified. */
  delivered: boolean
}

const STORAGE_KEY = 'voz-segura:alert-history:v1'
const MAX_ENTRIES = 20

let history: AlertHistoryEntry[] = readJson<AlertHistoryEntry[]>(STORAGE_KEY, [])
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function save(next: AlertHistoryEntry[]) {
  history = next
  writeJson(STORAGE_KEY, history)
  listeners.forEach((listener) => listener())
}

export function recordAlert(entry: AlertHistoryEntry): void {
  save([entry, ...history.filter((item) => item.alertId !== entry.alertId)].slice(0, MAX_ENTRIES))
}

export function clearAlertHistory(): void {
  save([])
}

export function useAlertHistory(): AlertHistoryEntry[] {
  return useSyncExternalStore(subscribe, () => history)
}
