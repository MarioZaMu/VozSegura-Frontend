import { ArrowLeft, AudioLines, HeartHandshake, Info, Loader2, MapPin, Navigation, Phone, Sparkles, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { routes } from '../../app/routes'
import { Card } from '../../components/ui/Card'
import {
  chunkRange,
  directionsUrl,
  formatAgo,
  formatDuration,
  isAlertId,
  ownerLabel,
  totalAudioMs,
  type AlertView,
} from '../../features/contact/alertView'
import { useAlertView } from '../../features/contact/useAlertView'
import { cx } from '../../lib/cx'
import { formatWatchTime } from '../../lib/formatDate'
import { isNativeApp } from '../../lib/platform'
import { useNow } from '../../lib/useNow'
import { AlertMap } from './AlertMap'

/** Colombia's national emergency line. */
const EMERGENCY_NUMBER = '123'

const stopReasonLabels = {
  user: 'la detuvo',
  'max-duration': 'terminó la grabación (5 min)',
  error: 'se detuvo por un error',
}

const linkButton = cx(
  'inline-flex min-h-touch grow basis-40 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-body-sm font-semibold',
  'transition duration-150 ease-out-soft active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
)

function Header({ view, now }: { view: AlertView; now: number }) {
  const active = view.status === 'active'
  const resolved = view.resolution !== null && !active
  return (
    <header className="flex flex-col gap-3 pt-2">
      <span
        className={cx(
          'inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-caption font-semibold',
          active ? 'bg-danger text-text-primary' : resolved ? 'bg-success/15 text-success' : 'bg-surface-raised text-text-secondary',
        )}
      >
        <span className={cx('size-2 rounded-full bg-current', active && 'animate-live-pulse')} />
        {active ? 'Alerta en curso' : resolved ? (view.resolution === 'safe' ? 'Está bien' : 'Falsa alarma') : 'Alerta finalizada'}
      </span>
      <h1 className="text-headline font-semibold">
        {ownerLabel(view)} activó una alerta silenciosa
      </h1>
      <p className="text-body-sm text-text-secondary">
        Empezó a las {formatWatchTime(new Date(view.startedAt))} ({formatAgo(view.startedAt, now)})
        {view.stoppedAt && view.stopReason
          ? ` · ${view.stopReason === 'user' ? `${ownerLabel(view)} ${stopReasonLabels.user}` : stopReasonLabels[view.stopReason]} a las ${formatWatchTime(new Date(view.stoppedAt))}`
          : ''}
      </p>
      {view.message && (
        <blockquote className="rounded-lg border-l-4 border-primary bg-surface p-4 text-body-sm">“{view.message}”</blockquote>
      )}
    </header>
  )
}

// The owner said how it ended: the most important news, so it goes right under the title.
function ResolutionBanner({ view }: { view: AlertView }) {
  if (!view.resolution) return null
  const safe = view.resolution === 'safe'
  const time = view.resolvedAt ? ` a las ${formatWatchTime(new Date(view.resolvedAt))}` : ''
  return (
    <div
      className={cx(
        'flex items-start gap-3 rounded-lg border p-4 text-body-sm animate-fade-in',
        safe ? 'border-success bg-success/15' : 'border-surface-raised bg-surface',
      )}
      role="status"
    >
      {safe ? <HeartHandshake size={22} className="shrink-0 text-success" /> : <Info size={22} className="shrink-0 text-primary" />}
      <p>
        {safe ? (
          <>
            <b>{ownerLabel(view)} avisó que está bien</b>
            {time}. Gracias por estar pendiente.
          </>
        ) : (
          <>
            <b>Falsa alarma:</b> {ownerLabel(view)} activó la alerta por error{time}. No hace falta hacer nada.
          </>
        )}
      </p>
    </div>
  )
}

function LocationCard({ view, now }: { view: AlertView; now: number }) {
  const last = view.lastLocation ?? view.locations.at(-1) ?? null
  return (
    <Card title="Ubicación" icon={<MapPin size={20} />} className="flex flex-col gap-4">
      <AlertMap locations={view.locations} live={view.status === 'active'} />
      {last ? (
        <p className="text-body-sm text-text-secondary">
          {view.status === 'active' ? 'Actualizada' : 'Última ubicación'} {formatAgo(last.time, now)} · precisión ±
          {Math.round(last.accuracy)} m
        </p>
      ) : (
        <p className="text-body-sm text-text-secondary">Aún no llega la ubicación. Puede tardar unos segundos.</p>
      )}
      <div className="flex flex-wrap gap-3">
        {last && (
          <a href={directionsUrl(last)} target="_blank" rel="noreferrer" className={cx(linkButton, 'bg-brand-gradient text-text-primary shadow-glow')}>
            <Navigation size={18} /> Cómo llegar
          </a>
        )}
        <a href={`tel:${EMERGENCY_NUMBER}`} className={cx(linkButton, 'bg-danger text-text-primary')}>
          <Phone size={18} /> Llamar al {EMERGENCY_NUMBER}
        </a>
      </div>
    </Card>
  )
}

function SummaryCard({ view, now }: { view: AlertView; now: number }) {
  const { summary, summaryStatus, summaryUpdatedAt, status } = view
  const generating = summaryStatus === 'generating'
  return (
    <Card title="Resumen de lo que pasa" icon={<Sparkles size={20} />} className="flex flex-col gap-3" aria-live="polite">
      {summary && <p className="text-body">{summary}</p>}
      {generating && (
        <p className="flex items-center gap-2 text-body-sm text-text-secondary">
          <Loader2 size={16} className="animate-spin text-primary" />
          {summary ? 'Actualizando el resumen con el audio nuevo…' : 'Generando resumen…'}
        </p>
      )}
      {!summary && summaryStatus === 'waiting' && (
        <p className="text-body-sm text-text-secondary">
          {status === 'active'
            ? 'El resumen aparecerá cuando llegue el primer audio (cada 20 segundos).'
            : view.chunks.length === 0
              ? 'Esta alerta no tiene audio, así que no hay resumen.'
              : 'Esperando el resto del audio para el resumen…'}
        </p>
      )}
      {summaryStatus === 'error' && (
        <p className="text-body-sm text-text-secondary">No se pudo generar el resumen. Escucha los audios abajo.</p>
      )}
      {summary && (
        <p className="text-caption text-text-secondary">
          {status === 'active' ? 'Resumen parcial' : 'Resumen final'}
          {summaryUpdatedAt ? ` · ${formatAgo(summaryUpdatedAt, now)}` : ''} · Hecho con IA: puede tener errores, confirma con
          los audios.
        </p>
      )}
    </Card>
  )
}

function AudioCard({ view }: { view: AlertView }) {
  const { chunks, status } = view
  return (
    <Card title="Audio" icon={<AudioLines size={20} />} className="flex flex-col gap-3">
      <p className="text-body-sm text-text-secondary">
        {chunks.length === 0
          ? status === 'active'
            ? 'El primer fragmento llega a los 20 segundos de grabación.'
            : 'No se recibió audio en esta alerta.'
          : `${chunks.length} fragmento${chunks.length === 1 ? '' : 's'} · ${formatDuration(totalAudioMs(chunks))} grabados${status === 'active' ? ' hasta ahora' : ''}`}
      </p>
      <ol className="flex flex-col gap-3">
        {chunks.map((chunk) => (
          <li key={chunk.index} className="flex flex-col gap-2 rounded-lg bg-surface-raised/50 p-4">
            <span className="text-caption font-medium text-text-secondary">{chunkRange(chunks, chunk.index)}</span>
            {chunk.audioUrl ? (
              <audio controls preload="none" src={chunk.audioUrl} className="w-full" />
            ) : (
              <span className="text-caption text-text-secondary">Audio de demostración (sin sonido)</span>
            )}
            <p className="text-body-sm">
              {chunk.transcriptStatus === 'done' && (chunk.transcript || <span className="text-text-secondary">Sin voz reconocible.</span>)}
              {chunk.transcriptStatus === 'pending' && (
                <span className="flex items-center gap-2 text-text-secondary">
                  <Loader2 size={14} className="animate-spin" /> Transcribiendo…
                </span>
              )}
              {chunk.transcriptStatus === 'error' && <span className="text-text-secondary">No se pudo transcribir.</span>}
            </p>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto grid min-h-full max-w-content place-items-center px-gutter text-center animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-title font-semibold">{title}</h1>
        <p className="text-body-sm text-text-secondary">{children}</p>
      </div>
    </main>
  )
}

// What the trusted contact opens from the Telegram link: who, where (live map), what is
// happening (AI summary + audio with transcripts) and what to do. Also reachable from the
// owner's alert history.
export function ContactAlertView() {
  const { alertId = '' } = useParams()
  const valid = alertId === 'demo' || isAlertId(alertId)
  const { view, notFound, offline } = useAlertView(valid ? alertId : 'demo')
  const now = useNow().getTime()

  if (!valid || notFound) {
    return <Message title="Alerta no encontrada">El enlace no es válido o la alerta ya expiró (se guardan 30 días).</Message>
  }
  if (!view) {
    return (
      <Message title="Cargando la alerta…">
        {offline ? 'No hay conexión. Reintentando…' : 'Un momento.'}
      </Message>
    )
  }

  return (
    <main className="mx-auto flex max-w-content flex-col gap-4 px-gutter pb-section animate-screen-in">
      {isNativeApp() && (
        <Link to={routes.settings} className="inline-flex min-h-touch items-center gap-2 self-start text-body-sm text-text-secondary">
          <ArrowLeft size={18} /> Volver a Configuración
        </Link>
      )}
      <Header view={view} now={now} />
      <ResolutionBanner view={view} />
      {offline && (
        <p className="flex items-center gap-2 rounded-lg bg-surface p-3 text-body-sm text-warning" role="status">
          <WifiOff size={16} /> Sin conexión: mostrando los últimos datos. Reintentando…
        </p>
      )}
      <LocationCard view={view} now={now} />
      <SummaryCard view={view} now={now} />
      <AudioCard view={view} />
      <p className="text-center text-caption text-text-secondary">
        Voz Segura · {view.status === 'active' ? 'Esta página se actualiza sola.' : 'Alerta guardada por 30 días.'}
      </p>
    </main>
  )
}
