import { ArrowLeft, AudioLines, HeartHandshake, Info, Loader2, MapPin, Navigation, Phone, Sparkles, WifiOff } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { routes } from '../../app/routes'
import { Card } from '../../components/ui/Card'
import { Logo } from '../../components/ui/Logo'
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
import { LanguageProvider } from '../../i18n/LanguageProvider'
import { useLanguage, useT } from '../../i18n/useT'
import { cx } from '../../lib/cx'
import { formatWatchTime } from '../../lib/formatDate'
import { isNativeApp } from '../../lib/platform'
import { useNow } from '../../lib/useNow'
import { AlertMap } from './AlertMap'

/** Colombia's national emergency line. */
const EMERGENCY_NUMBER = '123'

const linkButton = cx(
  'inline-flex min-h-touch grow basis-40 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-body-sm font-semibold',
  'transition duration-150 ease-out-soft active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
)

function Header({ view, now }: { view: AlertView; now: number }) {
  const t = useT()
  const language = useLanguage()
  const owner = ownerLabel(view, language)
  const time = (at: number) => formatWatchTime(new Date(at), language)
  const active = view.status === 'active'
  const resolved = view.resolution !== null && !active
  return (
    <header className="flex flex-col gap-3 pt-2">
      <Logo className="mb-1" />
      <span
        className={cx(
          'inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-caption font-semibold',
          active ? 'bg-danger text-on-accent' : resolved ? 'bg-success/15 text-success' : 'bg-surface-raised text-text-secondary',
        )}
      >
        <span className={cx('size-2 rounded-full bg-current', active && 'animate-live-pulse')} />
        {active ? t.contact.badgeActive : resolved ? (view.resolution === 'safe' ? t.contact.badgeSafe : t.contact.badgeFalseAlarm) : t.contact.badgeEnded}
      </span>
      <h1 className="text-headline font-semibold">{t.contact.title(owner)}</h1>
      <p className="text-body-sm text-text-secondary">
        {t.contact.startedAt(time(view.startedAt), formatAgo(view.startedAt, now, language))}
        {view.stoppedAt && view.stopReason ? ` · ${t.contact.stopped(view.stopReason, owner, time(view.stoppedAt))}` : ''}
      </p>
      {view.message && (
        <blockquote className="rounded-lg border-l-4 border-primary bg-surface p-4 text-body-sm">“{view.message}”</blockquote>
      )}
    </header>
  )
}

// The owner said how it ended: the most important news, so it goes right under the title.
function ResolutionBanner({ view }: { view: AlertView }) {
  const t = useT()
  const language = useLanguage()
  if (!view.resolution) return null
  const safe = view.resolution === 'safe'
  const owner = ownerLabel(view, language)
  const time = view.resolvedAt ? t.contact.atTime(formatWatchTime(new Date(view.resolvedAt), language)) : ''
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
            <b>{t.contact.safeTitle(owner)}</b>
            {time}
            {t.contact.safeRest}
          </>
        ) : (
          <>
            <b>{t.contact.falseAlarmTitle}</b>
            {t.contact.falseAlarm(owner, time)}
          </>
        )}
      </p>
    </div>
  )
}

function LocationCard({ view, now }: { view: AlertView; now: number }) {
  const t = useT()
  const language = useLanguage()
  const last = view.lastLocation ?? view.locations.at(-1) ?? null
  return (
    <Card title={t.contact.locationTitle} icon={<MapPin size={20} />} className="flex flex-col gap-4">
      <AlertMap locations={view.locations} live={view.status === 'active'} />
      {last ? (
        <p className="text-body-sm text-text-secondary">
          {(view.status === 'active' ? t.contact.locationUpdated : t.contact.locationLast)(
            formatAgo(last.time, now, language),
            Math.round(last.accuracy),
          )}
        </p>
      ) : (
        <p className="text-body-sm text-text-secondary">{t.contact.locationPending}</p>
      )}
      <div className="flex flex-wrap gap-3">
        {last && (
          <a href={directionsUrl(last)} target="_blank" rel="noreferrer" className={cx(linkButton, 'bg-brand-gradient text-on-accent shadow-glow')}>
            <Navigation size={18} /> {t.contact.directions}
          </a>
        )}
        <a href={`tel:${EMERGENCY_NUMBER}`} className={cx(linkButton, 'bg-danger text-on-accent')}>
          <Phone size={18} /> {t.contact.call(EMERGENCY_NUMBER)}
        </a>
      </div>
    </Card>
  )
}

function SummaryCard({ view, now }: { view: AlertView; now: number }) {
  const t = useT()
  const language = useLanguage()
  const { summary, summaryStatus, summaryUpdatedAt, status } = view
  const generating = summaryStatus === 'generating'
  return (
    <Card title={t.contact.summaryTitle} icon={<Sparkles size={20} />} className="flex flex-col gap-3" aria-live="polite">
      {summary && <p className="text-body">{summary}</p>}
      {generating && (
        <p className="flex items-center gap-2 text-body-sm text-text-secondary">
          <Loader2 size={16} className="animate-spin text-primary" />
          {summary ? t.contact.summaryUpdating : t.contact.summaryGenerating}
        </p>
      )}
      {!summary && summaryStatus === 'waiting' && (
        <p className="text-body-sm text-text-secondary">
          {status === 'active'
            ? t.contact.summaryWaitingLive
            : view.chunks.length === 0
              ? t.contact.summaryNoAudio
              : t.contact.summaryWaitingRest}
        </p>
      )}
      {summaryStatus === 'error' && (
        <p className="text-body-sm text-text-secondary">{t.contact.summaryError}</p>
      )}
      {summary && (
        <p className="text-caption text-text-secondary">
          {status === 'active' ? t.contact.summaryPartial : t.contact.summaryFinal}
          {summaryUpdatedAt ? ` · ${formatAgo(summaryUpdatedAt, now, language)}` : ''}
          {t.contact.summaryDisclaimer}
        </p>
      )}
    </Card>
  )
}

function AudioCard({ view }: { view: AlertView }) {
  const t = useT()
  const { chunks, status } = view
  return (
    <Card title={t.contact.audioTitle} icon={<AudioLines size={20} />} className="flex flex-col gap-3">
      <p className="text-body-sm text-text-secondary">
        {chunks.length === 0
          ? status === 'active'
            ? t.contact.audioFirstSoon
            : t.contact.audioNone
          : t.contact.audioSummary(chunks.length, formatDuration(totalAudioMs(chunks)), status === 'active')}
      </p>
      <ol className="flex flex-col gap-3">
        {chunks.map((chunk) => (
          <li key={chunk.index} className="flex flex-col gap-2 rounded-lg bg-surface-raised/50 p-4">
            <span className="text-caption font-medium text-text-secondary">{chunkRange(chunks, chunk.index)}</span>
            {chunk.audioUrl ? (
              <audio controls preload="none" src={chunk.audioUrl} className="w-full" />
            ) : (
              <span className="text-caption text-text-secondary">{t.contact.audioDemo}</span>
            )}
            <p className="text-body-sm">
              {chunk.transcriptStatus === 'done' && (chunk.transcript || <span className="text-text-secondary">{t.contact.noSpeech}</span>)}
              {chunk.transcriptStatus === 'pending' && (
                <span className="flex items-center gap-2 text-text-secondary">
                  <Loader2 size={14} className="animate-spin" /> {t.contact.transcribing}
                </span>
              )}
              {chunk.transcriptStatus === 'error' && <span className="text-text-secondary">{t.contact.transcriptError}</span>}
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
// owner's alert history. Shown in the language of the person who raised the alert.
export function ContactAlertView() {
  const { alertId = '' } = useParams()
  const valid = alertId === 'demo' || isAlertId(alertId)
  const uiLanguage = useLanguage()
  const { view, notFound, offline } = useAlertView(valid ? alertId : 'demo', uiLanguage)
  const now = useNow().getTime()
  const t = useT()

  if (!valid || notFound) {
    return <Message title={t.contact.notFoundTitle}>{t.contact.notFound}</Message>
  }
  if (!view) {
    return <Message title={t.contact.loadingTitle}>{offline ? t.contact.loadingOffline : t.contact.loading}</Message>
  }

  return (
    <LanguageProvider language={view.language}>
      <AlertPage view={view} now={now} offline={offline} />
    </LanguageProvider>
  )
}

function AlertPage({ view, now, offline }: { view: AlertView; now: number; offline: boolean }) {
  const t = useT()
  return (
    <main className="mx-auto flex max-w-content flex-col gap-4 px-gutter pb-section animate-screen-in" lang={view.language}>
      {isNativeApp() && (
        <Link to={routes.settings} className="inline-flex min-h-touch items-center gap-2 self-start text-body-sm text-text-secondary">
          <ArrowLeft size={18} /> {t.contact.backToSettings}
        </Link>
      )}
      <Header view={view} now={now} />
      <ResolutionBanner view={view} />
      {offline && (
        <p className="flex items-center gap-2 rounded-lg bg-surface p-3 text-body-sm text-warning" role="status">
          <WifiOff size={16} /> {t.contact.offline}
        </p>
      )}
      <LocationCard view={view} now={now} />
      <SummaryCard view={view} now={now} />
      <AudioCard view={view} />
      <p className="text-center text-caption text-text-secondary">
        Voz Segura · {view.status === 'active' ? t.contact.footerLive : t.contact.footerSaved}
      </p>
    </main>
  )
}
