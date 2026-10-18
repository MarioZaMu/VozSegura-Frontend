import { useEffect, useState } from 'react'

/** Current time, refreshed on every second boundary so the minute flips exactly on time. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    let timeoutId: number
    const tick = () => {
      const current = new Date()
      setNow(current)
      timeoutId = window.setTimeout(tick, 1000 - current.getMilliseconds())
    }
    timeoutId = window.setTimeout(tick, 1000 - new Date().getMilliseconds())
    return () => window.clearTimeout(timeoutId)
  }, [])

  return now
}
