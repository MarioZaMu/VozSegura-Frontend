import { useCallback, useEffect, useState } from 'react'
import { fetchContacts, type Contact } from '../../features/settings/settingsApi'

const PENDING_POLL_MS = 5000

/**
 * The device's contacts. Refreshes when the app comes back to the foreground (the user
 * usually switches to Telegram/WhatsApp to send the invite) and every few seconds while an
 * invite is pending, so "Pendiente" turns into "Confirmado" on its own.
 */
export function useContacts() {
  const [contacts, setContacts] = useState<Contact[] | null>(null)
  const [failed, setFailed] = useState(false)

  const refresh = useCallback(
    () =>
      fetchContacts().then(
        (list) => {
          setContacts(list)
          setFailed(false)
        },
        () => setFailed(true),
      ),
    [],
  )

  useEffect(() => {
    void refresh()
    const onVisible = () => document.visibilityState === 'visible' && void refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [refresh])

  const hasPending = contacts?.some((contact) => contact.status === 'pending') ?? false
  useEffect(() => {
    if (!hasPending) return
    const id = window.setInterval(() => document.visibilityState === 'visible' && void refresh(), PENDING_POLL_MS)
    return () => window.clearInterval(id)
  }, [hasPending, refresh])

  return { contacts, failed, refresh, setContacts }
}
