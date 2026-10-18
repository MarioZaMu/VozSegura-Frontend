import { ExternalLink, Send } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { buildContactAlertPath } from '../../app/routes'
import { Card } from '../../components/ui/Card'
import { useAlertHistory } from '../../features/alert/alertHistory'
import type { AlertSession } from '../../features/alert/alertSession'
import { demoAlertView } from '../../features/contact/demoAlertView'
import { currentDemoTimeline } from '../../features/contact/demoTimeline'
import { useLanguage, useT } from '../../i18n/useT'
import { cx } from '../../lib/cx'
import { formatWatchTime } from '../../lib/formatDate'

const demoPath = buildContactAlertPath('demo')

const linkClass = 'font-medium text-primary underline-offset-2 hover:underline'

function Bubble({ time, children }: { time: number; children: ReactNode }) {
  const language = useLanguage()
  return (
    <li className="flex flex-col gap-1 self-start rounded-lg rounded-tl-none bg-surface-raised px-4 py-3 text-body-sm animate-fade-in">
      {children}
      <span className="self-end text-caption text-text-secondary">{formatWatchTime(new Date(time), language)}</span>
    </li>
  )
}

// PC presentation only: the Telegram chat the trusted contact would get for a demo alert,
// message by message as the alert evolves (same texts as the backend, nothing is sent).
export function DemoTelegramPreview({ session, now }: { session: AlertSession; now: number }) {
  useAlertHistory() // re-render when "estoy bien" is marked in Settings
  const t = useT()
  const language = useLanguage()
  if (session.captureKind !== 'demo' || session.status === 'idle' || session.startedAt === null) return null

  const timeline = currentDemoTimeline(now)
  const view = demoAlertView(timeline, now, language)
  const tg = t.telegram
  const firstFix = view.locations[0]
  const finalReady = view.status === 'stopped' && (view.summaryStatus === 'ready' || view.chunks.length === 0)

  return (
    <Card title={t.telegramPreview.title} icon={<Send size={20} />} className="flex w-full flex-col gap-4">
      <p className="text-caption text-text-secondary">{t.telegramPreview.intro}</p>
      <ol className="flex flex-col gap-3" aria-live="polite">
        <Bubble time={timeline.startedAt}>
          <b>{tg.alertTitle}</b>
          <span>
            <b>{view.ownerName}</b>
            {tg.raised(formatWatchTime(new Date(timeline.startedAt), language))}
          </span>
          <span className="pt-2">💬 “{view.message}”</span>
          <span className="pt-2">
            📍 {firstFix ? <span className={linkClass}>{tg.seeLocation}</span> : tg.locationSoon}
            {firstFix && ` (±${Math.round(firstFix.accuracy)} m)`}
          </span>
          <span>
            🔴{' '}
            <Link to={demoPath} className={linkClass}>
              {tg.followLive}
            </Link>{' '}
            {tg.followLiveHint}
          </span>
        </Bubble>
        {finalReady && view.stoppedAt && (
          <Bubble time={view.summaryUpdatedAt ?? view.stoppedAt}>
            <b>✅ {view.stopReason === 'user' ? tg.stoppedByUser : tg.recordingEnded}</b>
            <span className="pt-2">
              {view.summary ? (
                <>
                  📝 <b>{tg.summaryTitle}</b> {tg.summaryHint}
                  <br />
                  {view.summary}
                </>
              ) : (
                tg.noAudio
              )}
            </span>
            <Link to={demoPath} className={cx(linkClass, 'pt-2')}>
              {tg.seeAlert}
            </Link>
          </Bubble>
        )}
        {view.resolution && view.resolvedAt && (
          <Bubble time={view.resolvedAt}>
            {view.resolution === 'safe' ? (
              <span>
                💚 <b>{view.ownerName}</b> {tg.safe[0]}
                <b>{tg.safe[1]}</b>
                {tg.safe[2]}
              </span>
            ) : (
              <span>
                ℹ️ <b>{tg.falseAlarm}</b> <b>{view.ownerName}</b>
                {tg.falseAlarmRest}
              </span>
            )}
          </Bubble>
        )}
      </ol>
      <Link
        to={demoPath}
        className="inline-flex min-h-touch items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 text-body-sm font-semibold text-on-accent shadow-glow"
      >
        <ExternalLink size={18} /> {t.telegramPreview.open}
      </Link>
    </Card>
  )
}
