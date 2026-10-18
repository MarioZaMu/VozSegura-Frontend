// Spanish date/time formatting for the watch face and the rest of the UI.
const LOCALE = 'es-CO'

const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
const watchDateParts = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })

/** "09:41" */
export function formatWatchTime(date: Date): string {
  return timeFormat.format(date)
}

/** "sáb 17 oct" — compact like a real watch: no commas or abbreviation dots. */
export function formatWatchDate(date: Date): string {
  const parts = watchDateParts.formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value.replace('.', '') ?? ''
  return `${pick('weekday')} ${pick('day')} ${pick('month')}`
}

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

/** "18 oct, 14:05" — for lists such as the alert history. */
export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date)
}
