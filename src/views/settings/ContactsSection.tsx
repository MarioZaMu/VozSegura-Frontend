import { Copy, Link2, Send, Trash2, UserPlus, Users } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextField } from '../../components/ui/TextField'
import {
  addContact,
  ApiError,
  MAX_CONTACTS,
  MAX_NAME_LENGTH,
  removeContact,
  renewInvite,
  type Contact,
  type ContactStatus,
} from '../../features/settings/settingsApi'
import { cx } from '../../lib/cx'
import { copyText, shareLink, type ShareResult } from '../../lib/share'
import { useContacts } from './useContacts'

const statusLabels: Record<ContactStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  left: 'Se dio de baja',
}

const statusClasses: Record<ContactStatus, string> = {
  pending: 'text-warning',
  confirmed: 'text-success',
  left: 'text-text-secondary',
}

const shareFeedback: Record<ShareResult, string> = {
  shared: '',
  copied: 'Enlace copiado. Pégalo en un chat con tu contacto.',
  failed: 'No se pudo compartir. Usa “Copiar enlace”.',
}

function inviteText(name: string) {
  return `Hola ${name}, te agregué como contacto de confianza en Voz Segura. Si algún día activo una alerta silenciosa, te llegará por Telegram con mi ubicación. Abre este enlace y toca “Iniciar”:`
}

function StatusChip({ status }: { status: ContactStatus }) {
  return (
    <span className={cx('rounded-full bg-surface-raised px-3 py-1 text-caption font-medium', statusClasses[status])}>
      {statusLabels[status]}
    </span>
  )
}

type ContactRowProps = {
  contact: Contact
  inviteUrl: string | undefined
  onShare: (contact: Contact) => void
  onCopy: (contact: Contact) => void
  onRemove: (contact: Contact) => void
  busy: boolean
}

function ContactRow({ contact, inviteUrl, onShare, onCopy, onRemove, busy }: ContactRowProps) {
  const [confirmRemove, setConfirmRemove] = useState(false)
  const waiting = contact.status !== 'confirmed'

  return (
    <li className="flex flex-col gap-3 rounded-lg bg-surface-raised/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body font-medium">{contact.name}</p>
          {contact.telegramName && (
            <p className="truncate text-caption text-text-secondary">Telegram: {contact.telegramName}</p>
          )}
        </div>
        <StatusChip status={contact.status} />
      </div>
      {contact.status === 'pending' && (
        <p className="text-caption text-text-secondary">Esperando a que abra el enlace y toque “Iniciar” en Telegram.</p>
      )}
      <div className="flex flex-wrap gap-2">
        {waiting && (
          <Button variant="secondary" icon={<Send size={16} />} onClick={() => onShare(contact)} disabled={busy}>
            {inviteUrl ? 'Compartir' : 'Nuevo enlace'}
          </Button>
        )}
        {waiting && inviteUrl && (
          <Button variant="ghost" icon={<Copy size={16} />} onClick={() => onCopy(contact)}>
            Copiar enlace
          </Button>
        )}
        {confirmRemove ? (
          <>
            <Button variant="danger" onClick={() => onRemove(contact)} disabled={busy}>
              Quitar
            </Button>
            <Button variant="ghost" onClick={() => setConfirmRemove(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setConfirmRemove(true)} aria-label={`Quitar a ${contact.name}`}>
            Quitar
          </Button>
        )}
      </div>
    </li>
  )
}

// Trusted contacts. Each one joins by opening a Telegram invite (t.me/<bot>?start=<code>);
// only confirmed contacts receive alerts.
export function ContactsSection() {
  const { contacts, failed, setContacts } = useContacts()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  // Invite links are only returned when created, so they live here until the view closes.
  const [inviteUrls, setInviteUrls] = useState<Record<string, string>>({})

  const share = async (contact: Contact, url: string) => {
    const result = await shareLink({ title: 'Invitación a Voz Segura', text: inviteText(contact.name), url })
    setFeedback(shareFeedback[result])
  }

  const add = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setBusy(true)
    setFeedback('')
    try {
      const { contact, inviteUrl } = await addContact(trimmed)
      setContacts((current) => [...(current ?? []), contact])
      setInviteUrls((current) => ({ ...current, [contact.id]: inviteUrl }))
      setName('')
      await share(contact, inviteUrl)
    } catch (error) {
      setFeedback(error instanceof ApiError && error.status === 409 ? `Máximo ${MAX_CONTACTS} contactos.` : 'No se pudo agregar. Revisa tu conexión.')
    } finally {
      setBusy(false)
    }
  }

  const shareExisting = async (contact: Contact) => {
    const known = inviteUrls[contact.id]
    if (known) return share(contact, known)
    // Pending without a known link (app reopened) or unsubscribed: replace it with a new invite.
    setBusy(true)
    try {
      const { contact: renewed, inviteUrl } = await renewInvite(contact.id)
      setContacts((current) => (current ?? []).map((item) => (item.id === contact.id ? renewed : item)))
      setInviteUrls((current) => ({ ...current, [renewed.id]: inviteUrl }))
      await share(renewed, inviteUrl)
    } catch {
      setFeedback('No se pudo crear el enlace. Revisa tu conexión.')
    } finally {
      setBusy(false)
    }
  }

  const copy = async (contact: Contact) => {
    const url = inviteUrls[contact.id]
    if (url) setFeedback((await copyText(url)) === 'copied' ? shareFeedback.copied : shareFeedback.failed)
  }

  const remove = async (contact: Contact) => {
    setBusy(true)
    try {
      await removeContact(contact.id)
      setContacts((current) => (current ?? []).filter((item) => item.id !== contact.id))
    } catch {
      setFeedback('No se pudo quitar. Revisa tu conexión.')
    } finally {
      setBusy(false)
    }
  }

  const confirmed = contacts?.filter((contact) => contact.status === 'confirmed').length ?? 0
  const full = (contacts?.length ?? 0) >= MAX_CONTACTS

  return (
    <Card title="Contactos de confianza" icon={<Users size={20} />} className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">
        Recibirán tus alertas por Telegram. Agrega a alguien y envíale la invitación; cuando toque “Iniciar” quedará confirmado.
      </p>

      {contacts === null && !failed && <p className="text-body-sm text-text-secondary">Cargando…</p>}
      {failed && contacts === null && <p className="text-body-sm text-danger">No se pudieron cargar tus contactos. Revisa tu conexión.</p>}

      {contacts !== null && contacts.length === 0 && (
        <p className="rounded-lg bg-surface-raised/50 p-4 text-body-sm text-text-secondary">
          Aún no tienes contactos. Mientras tanto, las alertas reales van al contacto de prueba del proyecto.
        </p>
      )}

      {contacts !== null && contacts.length > 0 && (
        <>
          <p className="text-body-sm" aria-live="polite">
            <Link2 size={14} className="mr-1 inline text-primary" />
            {confirmed} de {contacts.length} confirmado{contacts.length === 1 ? '' : 's'}
          </p>
          <ul className="flex flex-col gap-3">
            {contacts.map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                inviteUrl={inviteUrls[contact.id]}
                onShare={shareExisting}
                onCopy={copy}
                onRemove={remove}
                busy={busy}
              />
            ))}
          </ul>
        </>
      )}

      <div className="flex flex-col gap-3">
        <TextField
          label="Nuevo contacto"
          value={name}
          onChange={setName}
          placeholder="Nombre (ej. Mamá)"
          maxLength={MAX_NAME_LENGTH}
          disabled={busy || full || contacts === null}
          onEnter={add}
        />
        <Button icon={<UserPlus size={18} />} onClick={add} disabled={busy || full || !name.trim() || contacts === null} fullWidth>
          {busy ? 'Un momento…' : 'Agregar e invitar'}
        </Button>
      </div>
      {feedback && (
        <p className="text-body-sm text-text-secondary" aria-live="polite">
          {feedback}
        </p>
      )}
    </Card>
  )
}
