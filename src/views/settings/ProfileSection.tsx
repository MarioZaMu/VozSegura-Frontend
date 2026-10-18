import { UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TextField } from '../../components/ui/TextField'
import {
  fetchDeviceProfile,
  MAX_MESSAGE_LENGTH,
  MAX_NAME_LENGTH,
  saveDeviceProfile,
  type DeviceProfile,
} from '../../features/settings/settingsApi'
import { useT } from '../../i18n/useT'

type SaveState = 'idle' | 'saving' | 'saved' | 'failed'

// Owner name and personal message: both appear in the Telegram alert the contacts receive.
export function ProfileSection() {
  const t = useT().profile
  const [saved, setSaved] = useState<DeviceProfile | null>(null)
  const [draft, setDraft] = useState<DeviceProfile>({ ownerName: '', message: '' })
  const [loadFailed, setLoadFailed] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>('idle')

  useEffect(() => {
    fetchDeviceProfile().then(
      (profile) => {
        setSaved(profile)
        setDraft(profile)
      },
      () => setLoadFailed(true),
    )
  }, [])

  const changed = saved !== null && (draft.ownerName.trim() !== saved.ownerName || draft.message.trim() !== saved.message)

  const save = async () => {
    setSaveState('saving')
    try {
      const profile = await saveDeviceProfile({ ownerName: draft.ownerName.trim(), message: draft.message.trim() })
      setSaved(profile)
      setDraft(profile)
      setSaveState('saved')
    } catch {
      setSaveState('failed')
    }
  }

  const edit = (patch: Partial<DeviceProfile>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setSaveState('idle')
  }

  return (
    <Card title={t.title} icon={<UserRound size={20} />} className="flex flex-col gap-4">
      <p className="text-body-sm text-text-secondary">{t.intro}</p>
      {loadFailed && <p className="text-body-sm text-danger">{t.loadFailed}</p>}
      <TextField
        label={t.name}
        value={draft.ownerName}
        onChange={(ownerName) => edit({ ownerName })}
        placeholder={t.namePlaceholder}
        maxLength={MAX_NAME_LENGTH}
        disabled={saved === null}
      />
      <TextField
        label={t.message}
        value={draft.message}
        onChange={(message) => edit({ message })}
        placeholder={t.messagePlaceholder}
        maxLength={MAX_MESSAGE_LENGTH}
        multiline
        disabled={saved === null}
      />
      <div className="flex items-center gap-4">
        <Button onClick={save} disabled={!changed || saveState === 'saving'}>
          {saveState === 'saving' ? t.saving : t.save}
        </Button>
        <span className="text-body-sm text-text-secondary" aria-live="polite">
          {saveState === 'saved' && t.saved}
          {saveState === 'failed' && <span className="text-danger">{t.saveFailed}</span>}
        </span>
      </div>
    </Card>
  )
}
