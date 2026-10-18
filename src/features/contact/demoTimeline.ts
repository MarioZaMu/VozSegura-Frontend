import { getAlertHistory } from '../alert/alertHistory'
import { getAlertSession } from '../alert/alertSessionStore'
import { scriptedTimeline, type DemoTimeline } from './demoAlertView'

/**
 * Presentation flow: after a demo alert on the watch (double tap with demo mode on),
 * /alerta/demo follows that alert — started at the double tap, stopped by the triple tap,
 * "estoy bien" from Settings. Without one it plays the scripted alert.
 */
export function currentDemoTimeline(openedAt: number): DemoTimeline {
  const session = getAlertSession()
  if (session.captureKind !== 'demo' || session.startedAt === null || !session.alertId) return scriptedTimeline(openedAt)
  const entry = getAlertHistory().find((item) => item.alertId === session.alertId)
  return {
    startedAt: session.startedAt,
    stoppedAt: session.stoppedAt,
    stopReason: session.stopReason,
    resolution: entry?.resolution ?? null,
    resolvedAt: entry?.resolvedAt ?? null,
  }
}
