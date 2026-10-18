import { MapPin, Mic, Send, ShieldAlert, Square } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import type { Messages } from '../../i18n/messages'
import { useT } from '../../i18n/useT'
import { cx } from '../../lib/cx'
import type { CaptureSource } from './alertCapture'
import type { AlertSession, DeliveryState } from './alertSession'
import { stopAlert } from './alertSessionStore'

type AlertDiagnosticsProps = {
  session: AlertSession
  now: Date
}

const sourceIcons: Record<CaptureSource, ReactNode> = {
  microphone: <Mic size={14} />,
  location: <MapPin size={14} />,
}

function describeDelivery(delivery: DeliveryState, t: Messages['diagnostics']): string {
  if (delivery.alert === 'off') return t.alertDelivery.off
  const parts = [t.alertDelivery[delivery.alert], t.locationsSent(delivery.locationsSent), t.chunksUploaded(delivery.chunksUploaded)]
  if (delivery.chunksFailed > 0) parts.push(t.chunksFailed(delivery.chunksFailed))
  if (delivery.stop !== 'pending') parts.push(delivery.stop === 'sent' ? t.stopSent : t.stopFailed)
  return parts.join(' · ')
}

function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function formatKilobytes(bytes: number): string {
  return `${Math.round(bytes / 1024)} KB`
}

// PC-only panel: what the active alert is capturing. The watch face itself never changes,
// so this is the only place (besides the contact view) where the alert is visible.
export function AlertDiagnostics({ session, now }: AlertDiagnosticsProps) {
  const t = useT().diagnostics
  const { status, startedAt, stoppedAt, locations, chunks, errors } = session
  const lastFix = locations[0]
  const elapsed = startedAt ? (stoppedAt ?? now.getTime()) - startedAt : 0
  const audioBytes = chunks.reduce((total, chunk) => total + chunk.sizeBytes, 0)

  return (
    <Card title={t.title} icon={<ShieldAlert size={20} />} className="w-full">
      <p className="mb-3 text-body-sm text-text-secondary" aria-live="polite">
        <span className={cx('font-medium', status === 'active' ? 'text-primary' : 'text-text-primary')}>
          {t.status[status]}
        </span>
        {status !== 'idle' && ` · ${formatElapsed(elapsed)}`}
        {session.captureKind && ` · ${t.captureKind(session.captureKind)}`}
        {session.stopReason && ` · ${t.stopReasons[session.stopReason]}`}
      </p>

      {status === 'idle' ? (
        <p className="text-body-sm text-text-secondary">{t.idle}</p>
      ) : (
        <div className="flex flex-col gap-3 text-body-sm">
          <ul className="flex flex-col gap-2">
            {(Object.keys(sourceIcons) as CaptureSource[]).map((source) => (
              <li key={source} className="flex items-center gap-3">
                <span
                  className={cx(
                    'grid size-6 shrink-0 place-items-center rounded-full bg-surface-raised',
                    session.sources[source] === 'error' ? 'text-danger' : 'text-text-secondary',
                  )}
                >
                  {sourceIcons[source]}
                </span>
                <span className="flex-1">
                  {source === 'microphone' ? t.microphone : t.location}: {t.sources[session.sources[source]]}
                </span>
                <span className="text-caption text-text-secondary tabular-nums">
                  {source === 'microphone'
                    ? `${t.chunks(chunks.length)} · ${formatKilobytes(audioBytes)}`
                    : lastFix
                      ? `${lastFix.latitude.toFixed(5)}, ${lastFix.longitude.toFixed(5)} · ±${Math.round(lastFix.accuracy)} m`
                      : t.noData}
                </span>
              </li>
            ))}
          </ul>

          <p className="flex items-center gap-3">
            <span
              className={cx(
                'grid size-6 shrink-0 place-items-center rounded-full bg-surface-raised',
                session.delivery.alert === 'failed' ? 'text-danger' : 'text-text-secondary',
              )}
            >
              <Send size={14} />
            </span>
            <span className="flex-1">
              {t.delivery}: {describeDelivery(session.delivery, t)}
            </span>
          </p>

          {errors.length > 0 && (
            <ul className="flex flex-col gap-1 text-caption text-danger">
              {errors.map((error) => (
                <li key={`${error.time}-${error.source}`}>{error.message}</li>
              ))}
            </ul>
          )}

          {status === 'active' && (
            <Button variant="secondary" icon={<Square size={16} />} onClick={() => void stopAlert('user')}>
              {t.stop}
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
