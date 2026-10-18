// Date/time formatting in the UI language (es-CO or en-US). Formatters are cached per language.
import { getLanguage } from '../i18n/currentLanguage'
import { localeOf, type Language } from '../i18n/language'

type Formatters = { time: Intl.DateTimeFormat; clock: Intl.DateTimeFormat; watchDate: Intl.DateTimeFormat; dateTime: Intl.DateTimeFormat }

const cache = new Map<Language, Formatters>()

function formatters(language: Language): Formatters {
  let cached = cache.get(language)
  if (!cached) {
    const locale = localeOf(language)
    cached = {
      time: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
      clock: new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }),
      watchDate: new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' }),
      dateTime: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
    }
    cache.set(language, cached)
  }
  return cached
}

/** "09:41" (24 h in both languages, like the watch). */
export function formatWatchTime(date: Date, language: Language = getLanguage()): string {
  return formatters(language).time.format(date)
}

/** "09:41:07" — for diagnostics logs. */
export function formatClock(date: Date, language: Language = getLanguage()): string {
  return formatters(language).clock.format(date)
}

/** "sáb 17 oct" / "Sat Oct 17" — compact like a real watch: no commas or abbreviation dots. */
export function formatWatchDate(date: Date, language: Language = getLanguage()): string {
  const parts = formatters(language).watchDate.formatToParts(date)
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value.replace('.', '') ?? ''
  return language === 'en'
    ? `${pick('weekday')} ${pick('month')} ${pick('day')}`
    : `${pick('weekday')} ${pick('day')} ${pick('month')}`
}

/** "18 oct, 14:05" / "Oct 18, 14:05" — for lists such as the alert history. */
export function formatDateTime(date: Date, language: Language = getLanguage()): string {
  return formatters(language).dateTime.format(date)
}

/** "8.432" / "8,432" */
export function formatNumber(value: number, language: Language = getLanguage()): string {
  return value.toLocaleString(localeOf(language))
}
