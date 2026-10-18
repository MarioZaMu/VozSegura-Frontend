import { MapPin, Mic, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import {
  checkCapturePermissions,
  requestCapturePermissions,
  type CapturePermissionStatus,
  type PermissionStatus,
} from '../../features/settings/capturePermissions'
import { useT } from '../../i18n/useT'
import { cx } from '../../lib/cx'
import { isNativeApp } from '../../lib/platform'

const statusClasses: Record<PermissionStatus, string> = {
  granted: 'text-success',
  denied: 'text-danger',
  prompt: 'text-warning',
  unknown: 'text-text-secondary',
}

function PermissionRow({ icon, label, status }: { icon: ReactNode; label: string; status: PermissionStatus | undefined }) {
  const t = useT().permissions
  return (
    <li className="flex min-h-touch items-center justify-between gap-4">
      <span className="flex items-center gap-3 text-body-sm font-medium">
        <span className="text-primary">{icon}</span>
        {label}
      </span>
      <span className={cx('text-body-sm', status ? statusClasses[status] : 'text-text-secondary')}>
        {status ? t.status[status] : '…'}
      </span>
    </li>
  )
}

// Microphone and location are asked here, ahead of time: a permission dialog at the moment
// of the alert would give the gesture away. Without them the alert is still sent.
export function PermissionsSection() {
  const t = useT().permissions
  const [status, setStatus] = useState<CapturePermissionStatus | null>(null)
  const [asking, setAsking] = useState(false)

  const refresh = useCallback(() => {
    checkCapturePermissions().then(setStatus, () => setStatus({ microphone: 'unknown', location: 'unknown' }))
  }, [])

  useEffect(() => {
    refresh()
    // The user may change them in the phone settings and come back.
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refresh])

  const request = async () => {
    setAsking(true)
    setStatus(await requestCapturePermissions())
    setAsking(false)
  }

  const allGranted = status?.microphone === 'granted' && status.location === 'granted'
  const anyDenied = status?.microphone === 'denied' || status?.location === 'denied'

  return (
    <Card title={t.title} icon={<ShieldCheck size={20} />} className="flex flex-col gap-3">
      <p className="text-body-sm text-text-secondary">{t.intro}</p>
      <ul className="flex flex-col">
        <PermissionRow icon={<Mic size={18} />} label={t.microphone} status={status?.microphone} />
        <PermissionRow icon={<MapPin size={18} />} label={t.location} status={status?.location} />
      </ul>
      {!allGranted && (
        <Button onClick={request} disabled={asking || status === null} fullWidth>
          {asking ? t.asking : t.grant}
        </Button>
      )}
      {anyDenied && (
        <p className="text-caption text-text-secondary">
          {isNativeApp() ? t.blockedApp : t.blockedWeb}
        </p>
      )}
    </Card>
  )
}
