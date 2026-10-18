import { useEffect, useState } from 'react'
import { AlertNotFoundError, fetchAlertView, isFinal, type AlertView } from './alertView'
import { demoAlertView } from './demoAlertView'
import { currentDemoTimeline } from './demoTimeline'

const POLL_MS = 5000
const DEMO_TICK_MS = 1000

export type AlertViewState = {
  view: AlertView | null
  notFound: boolean
  /** The last refresh failed; `view` keeps the previous data. */
  offline: boolean
}

/**
 * Live data of an alert for the contact view: polls every 5 s while something can still
 * change (paused while the tab is hidden) and stops once the alert is final.
 * "demo" returns the simulated alert instead.
 */
export function useAlertView(alertId: string): AlertViewState {
  const [state, setState] = useState<AlertViewState>({ view: null, notFound: false, offline: false })

  useEffect(() => {
    if (alertId === 'demo') {
      const openedAt = Date.now()
      const tick = () =>
        setState({ view: demoAlertView(currentDemoTimeline(openedAt), Date.now()), notFound: false, offline: false })
      const first = window.setTimeout(tick, 0)
      const id = window.setInterval(tick, DEMO_TICK_MS)
      return () => {
        window.clearTimeout(first)
        window.clearInterval(id)
      }
    }

    let timer: number | undefined
    let stopped = false

    const load = async () => {
      window.clearTimeout(timer)
      try {
        const view = await fetchAlertView(alertId)
        if (stopped) return
        setState({ view, notFound: false, offline: false })
        if (isFinal(view, Date.now())) return
      } catch (error) {
        if (stopped) return
        if (error instanceof AlertNotFoundError) return setState({ view: null, notFound: true, offline: false })
        setState((current) => ({ ...current, offline: true }))
      }
      if (document.visibilityState === 'visible') timer = window.setTimeout(load, POLL_MS)
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') void load()
      else window.clearTimeout(timer)
    }

    void load()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [alertId])

  return state
}
