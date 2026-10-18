// Public URL paths. They are user-visible (the contact receives /alerta/:id),
// so they are in Spanish while the code stays in English.
export const routes = {
  watch: '/',
  settings: '/configuracion',
  contactAlert: '/alerta/:alertId',
} as const

export const buildContactAlertPath = (alertId: string) => `/alerta/${encodeURIComponent(alertId)}`
