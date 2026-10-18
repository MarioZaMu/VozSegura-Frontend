import { ExternalLink, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { buildContactAlertPath } from '../../app/routes'
import { Card } from '../../components/ui/Card'
import { useAlertHistory } from '../../features/alert/alertHistory'
import type { AlertSession } from '../../features/alert/alertSession'
import { demoAlertView } from '../../features/contact/demoAlertView'
import { currentDemoTimeline } from '../../features/contact/demoTimeline'
import { cx } from '../../lib/cx'
import { formatWatchTime } from '../../lib/formatDate'

const OWNER = 'Laura'
const MESSAGE = 'Si recibes esto, llámame. Estoy saliendo de la universidad.'
const demoPath = buildContactAlertPath('demo')

const linkClass = 'font-medium text-primary underline-offset-2 hover:underline'

function Bubble({ time, children }: { time: number; children: ReactNode }) {
  return (
    <li className="flex flex-col gap-1 self-start rounded-lg rounded-tl-none bg-surface-raised px-4 py-3 text-body-sm animate-fade-in">
      {children}
      <span className="self-end text-caption text-text-secondary">{formatWatchTime(new Date(time))}</span>
    </li>
  )
}

// PC presentation only: the Telegram chat the trusted contact would get for a demo alert,
// message by message as the alert evolves (same texts as the backend, nothing is sent).
export function DemoTelegramPreview({ session, now }: { session: AlertSession; now: number }) {
  useAlertHistory() // re-render when "estoy bien" is marked in Settings
  if (session.captureKind !== 'demo' || session.status === 'idle' || session.startedAt === null) return null

  const timeline = currentDemoTimeline(now)
  const view = demoAlertView(timeline, now)
  const firstFix = view.locations[0]
  const finalReady = view.status === 'stopped' && (view.summaryStatus === 'ready' || view.chunks.length === 0)

  return (
    <Card title="Así le llega a tu contacto" icon={<Send size={20} />} className="flex w-full flex-col gap-4">
      <p className="text-caption text-text-secondary">Chat de Telegram simulado (modo demo: no se envía nada).</p>
      <ol className="flex flex-col gap-3" aria-live="polite">
        <Bubble time={timeline.startedAt}>
          <b>🚨 Alerta de Voz Segura</b>
          <span>
            <b>{OWNER}</b> activó una alerta silenciosa a las {formatWatchTime(new Date(timeline.startedAt))}.
          </span>
          <span className="pt-2">💬 “{MESSAGE}”</span>
          <span className="pt-2">
            📍 {firstFix ? <span className={linkClass}>Ver ubicación</span> : 'La ubicación llegará en unos segundos.'}
            {firstFix && ` (±${Math.round(firstFix.accuracy)} m)`}
          </span>
          <span>
            🔴{' '}
            <Link to={demoPath} className={linkClass}>
              Seguir la alerta en vivo
            </Link>{' '}
            (audio y resumen)
          </span>
        </Bubble>
        {finalReady && view.stoppedAt && (
          <Bubble time={view.summaryUpdatedAt ?? view.stoppedAt}>
            <b>✅ {view.stopReason === 'user' ? 'La alerta se detuvo desde el reloj.' : 'La grabación de la alerta terminó.'}</b>
            <span className="pt-2">
              {view.summary ? (
                <>
                  📝 <b>Resumen del audio</b> (generado por IA, puede tener errores):
                  <br />
                  {view.summary}
                </>
              ) : (
                '🎙️ No se pudo grabar audio en esta alerta.'
              )}
            </span>
            <Link to={demoPath} className={cx(linkClass, 'pt-2')}>
              🔴 Ver la alerta
            </Link>
          </Bubble>
        )}
        {view.resolution && view.resolvedAt && (
          <Bubble time={view.resolvedAt}>
            {view.resolution === 'safe' ? (
              <span>
                💚 <b>{OWNER}</b> avisó que <b>está bien</b>. Gracias por estar pendiente.
              </span>
            ) : (
              <span>
                ℹ️ <b>Falsa alarma:</b> <b>{OWNER}</b> activó la alerta por error. Todo está bien, no hace falta hacer nada.
              </span>
            )}
          </Bubble>
        )}
      </ol>
      <Link
        to={demoPath}
        className="inline-flex min-h-touch items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 text-body-sm font-semibold text-on-accent shadow-glow"
      >
        <ExternalLink size={18} /> Ver lo que recibe tu contacto
      </Link>
    </Card>
  )
}
