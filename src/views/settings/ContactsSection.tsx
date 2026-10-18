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
import type { Messages } from '../../i18n/messages'
import { useT } from '../../i18n/useT'
import { cx } from '../../lib/cx'
import { copyText, shareLink, type ShareResult } from '../../lib/share'
import { useContacts } from './useContacts'

const statusClasses: Record<ContactStatus, string> = {
  pending: 'text-warning',
  confirmed: 'text-success',
  left: 'text-text-secondary',
}

function shareFeedback(result: ShareResult, t: Messages['contacts']): string {
  return { shared: '', copied: t.copied, failed: t.shareFailed }[result]
}

function StatusChip({ status }: { status: ContactStatus }) {
  const t = useT().contacts
  return (
    <span className={cx('rounded-full bg-surface-raised px-3 py-1 text-caption font-medium', statusClasses[status])}>
      {t.status[status]}
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
  const t = useT().contacts
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
        <p className="text-caption text-text-secondary">{t.waitingStart}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {waiting && (
          <Button variant="secondary" icon={<Send size={16} />} onClick={() => onShare(contact)} disabled={busy}>
            {inviteUrl ? t.share : t.newLink}
          </Button>
        )}
        {waiting && inviteUrl && (
          <Button variant="ghost" icon={<Copy size={16} />} onClick={() => onCopy(contact)}>
            {t.copyLink}
          </Button>
        )}
        {confirmRemove ? (
          <>
            <Button variant="danger" onClick={() => onRemove(contact)} disabled={busy}>
              {t.remove}
            </Button>
            <Button variant="ghost" onClick={() => setConfirmRemove(false)}>
              {t.cancel}
            </Button>
          </>
        ) : (
          <Button variant="ghost" icon={<Trash2 size={16} />} onClick={() => setConfirmRemove(true)} aria-label={t.removeLabel(contact.name)}>
            {t.remove}
          </Button>
        )}
      </div>
    </li>
  )
}

// Trusted contacts. Each one joins by opening a Telegram invite (t.me/<bot>?start=<code>);
// only confirmed contacts receive alerts.
export function ContactsSection() {
  const t = useT().contacts
  const { contacts, failed, setContacts } = useContacts()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  // Invite links are only returned when created, so they live here until the view closes.
  const [inviteUrls, setInviteUrls] = useState<Record<string, string>>({})

  const share = async (contact: Contact, url: string) => {
    const result = await shareLink({ title: t.inviteTitle, text: t.inviteText(contact.name), url })
    setFeedback(shareFeedback(result, t))
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
      setFeedback(error instanceof ApiError && error.status === 409 ? t.max(MAX_CONTACTS) : t.addFailed)
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
      setFeedback(t.linkFailed)
    } finally {
      setBusy(false)
    }
  }

  const copy = async (contact: Contact) => {
    const url = inviteUrls[contact.id]
    if (url) setFeedback(shareFeedback((await copyText(url)) === 'copied' ? 'copied' : 'failed', t))
  }

  const remove = async (contact: Contact) => {
    setBusy(true)
    try {
      await removeContact(contact.id)
      setContacts((current) => (current ?? []).filter((item) => item.id !== contact.id))
    } catch {
      setFeedback(t.removeFailed)
    } finally {
      setBusy(false)
    }
  }

  const confirmed = contacts?.filter((contact) => contact.status === 'confirmed').length ?? 0
  const full = (contacts?.length ?? 0) >= MAX_CONTACTS

  return (
    <Card title={t.title} icon={<Users size={20} />} className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">{t.intro}</p>

      {contacts === null && !failed && <p className="text-body-sm text-text-secondary">{t.loading}</p>}
      {failed && contacts === null && <p className="text-body-sm text-danger">{t.loadFailed}</p>}

      {contacts !== null && contacts.length === 0 && (
        <p className="rounded-lg bg-surface-raised/50 p-4 text-body-sm text-text-secondary">
          {t.empty}
        </p>
      )}

      {contacts !== null && contacts.length > 0 && (
        <>
          <p className="text-body-sm" aria-live="polite">
            <Link2 size={14} className="mr-1 inline text-primary" />
            {t.confirmedCount(confirmed, contacts.length)}
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
          label={t.newContact}
          value={name}
          onChange={setName}
          placeholder={t.namePlaceholder}
          maxLength={MAX_NAME_LENGTH}
          disabled={busy || full || contacts === null}
          onEnter={add}
        />
        <Button icon={<UserPlus size={18} />} onClick={add} disabled={busy || full || !name.trim() || contacts === null} fullWidth>
          {busy ? t.adding : t.add}
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
