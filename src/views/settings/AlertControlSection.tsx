import { Heart, Info, ShieldAlert, ShieldCheck, Square } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { buildContactAlertPath } from '../../app/routes'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { PermanentError, postResolve } from '../../features/alert/alertApi'
import { setAlertResolution, useAlertHistory, type Resolution } from '../../features/alert/alertHistory'
import { stopAnyAlert, useAlertSession, useOrphanNativeAlertId } from '../../features/alert/alertSessionStore'
import { formatAgo } from '../../features/contact/alertView'
import { useNow } from '../../lib/useNow'

/** After a day the last alert is history, not something to answer. */
const RECENT_MS = 24 * 60 * 60 * 1000

const resolvedText: Record<Resolution, string> = {
  safe: 'Avisaste a tus contactos que estás bien.',
  'false-alarm': 'Avisaste a tus contactos que fue una falsa alarma.',
}

// Top of Settings while an alert is recording or just ended: stop it without the triple tap,
// and tell the contacts how it ended ("estoy bien" / false alarm). Hidden otherwise.
export function AlertControlSection() {
  const session = useAlertSession()
  const orphanAlertId = useOrphanNativeAlertId()
  const history = useAlertHistory()
  const now = useNow().getTime()
  const [busy, setBusy] = useState<'stop' | Resolution | null>(null)
  const [failed, setFailed] = useState(false)

  const activeId = session.status === 'active' ? session.alertId : orphanAlertId
  const latest = history[0]
  const entry = activeId ? history.find((item) => item.alertId === activeId) : latest
  if (!activeId && (!entry || now - entry.startedAt > RECENT_MS)) return null

  const alertId = activeId ?? entry!.alertId
  // An orphan alert started by an older app session is real (only real alerts use the service).
  const delivered = entry?.delivered ?? true
  const resolution = entry?.resolution

  const stop = async () => {
    setBusy('stop')
    await stopAnyAlert().finally(() => setBusy(null))
  }

  const resolve = async (next: Resolution) => {
    setBusy(next)
    setFailed(false)
    try {
      if (activeId) await stopAnyAlert()
      if (delivered) await postResolve(alertId, next)
      setAlertResolution(alertId, next)
    } catch (error) {
      // 404: the alert never reached the server (no signal), so nobody needs to be told.
      if (error instanceof PermanentError && error.status === 404) setAlertResolution(alertId, next)
      else setFailed(true)
    } finally {
      setBusy(null)
    }
  }

  if (resolution && !activeId) {
    return (
      <Card title="Tu última alerta" icon={<ShieldCheck size={20} />} className="flex flex-col gap-3">
        <p className="text-body-sm text-text-secondary">
          {resolvedText[resolution]}
          {!delivered && ' (Demo: no se envió nada.)'}
        </p>
        <Link to={buildContactAlertPath(alertId)} className="text-body-sm font-medium text-primary">
          Ver la alerta
        </Link>
      </Card>
    )
  }

  return (
    <Card
      title={activeId ? 'Alerta en curso' : 'Tu última alerta'}
      icon={activeId ? <ShieldAlert size={20} className="text-danger" /> : <Info size={20} />}
      className="flex flex-col gap-4"
      aria-live="polite"
    >
      <p className="text-body-sm text-text-secondary">
        {activeId
          ? 'Se está grabando y enviando a tus contactos. Puedes detenerla aquí o con un triple toque en el reloj. Si avisas que estás bien, también se detiene.'
          : `Empezó ${entry ? formatAgo(entry.startedAt, now) : ''}. Cuéntales a tus contactos cómo terminó:`}
      </p>
      <div className="flex flex-col gap-3">
        {activeId && (
          <Button variant="danger" icon={<Square size={18} />} onClick={stop} disabled={busy !== null} fullWidth>
            {busy === 'stop' ? 'Deteniendo…' : 'Detener alerta'}
          </Button>
        )}
        <Button icon={<Heart size={18} />} onClick={() => resolve('safe')} disabled={busy !== null} fullWidth>
          {busy === 'safe' ? 'Avisando…' : 'Avisar que estoy bien'}
        </Button>
        <Button variant="secondary" onClick={() => resolve('false-alarm')} disabled={busy !== null} fullWidth>
          {busy === 'false-alarm' ? 'Avisando…' : 'Fue una falsa alarma'}
        </Button>
      </div>
      {failed && (
        <p className="text-body-sm text-warning" role="alert">
          No se pudo avisar. Revisa la conexión e inténtalo de nuevo.
        </p>
      )}
    </Card>
  )
}
