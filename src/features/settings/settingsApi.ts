import { config } from '../../lib/config'
import { getDeviceId } from '../../lib/deviceId'

// Client for the device settings and trusted contacts endpoints (see the backend README).

export type ContactStatus = 'pending' | 'confirmed' | 'left'

export type Contact = {
  id: string
  name: string
  status: ContactStatus
  /** First name the contact has on Telegram, once confirmed. */
  telegramName: string | null
  createdAt: number
  confirmedAt: number | null
}

export type DeviceProfile = { ownerName: string; message: string }

export type NewInvite = { contact: Contact; inviteUrl: string }

export const MAX_CONTACTS = 10
export const MAX_NAME_LENGTH = 40
export const MAX_MESSAGE_LENGTH = 280

const REQUEST_TIMEOUT_MS = 15_000

export class ApiError extends Error {
  readonly status: number

  constructor(status: number) {
    super(`HTTP ${status}`)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: { ...init.headers, 'Content-Type': 'application/json', Authorization: `Bearer ${config.alertApiToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) throw new ApiError(response.status)
  return response.json() as Promise<T>
}

const query = (params: Record<string, string>) => new URLSearchParams({ deviceId: getDeviceId(), ...params })

export function fetchDeviceProfile(): Promise<DeviceProfile> {
  return request(`/api/device?${query({})}`)
}

export function saveDeviceProfile(profile: DeviceProfile): Promise<DeviceProfile> {
  return request('/api/device', { method: 'POST', body: JSON.stringify({ deviceId: getDeviceId(), ...profile }) })
}

export async function fetchContacts(): Promise<Contact[]> {
  const { contacts } = await request<{ contacts: Contact[] }>(`/api/contacts?${query({})}`)
  return contacts
}

export function addContact(name: string): Promise<NewInvite> {
  return request('/api/contacts', { method: 'POST', body: JSON.stringify({ deviceId: getDeviceId(), name }) })
}

/** Replaces a contact with a new one carrying a fresh invite link. */
export function renewInvite(contactId: string): Promise<NewInvite> {
  return request('/api/contacts', { method: 'PUT', body: JSON.stringify({ deviceId: getDeviceId(), contactId }) })
}

export async function removeContact(contactId: string): Promise<void> {
  await request(`/api/contacts?${query({ contactId })}`, { method: 'DELETE' })
}
