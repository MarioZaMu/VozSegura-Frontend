import type { LocationFix, StopReason } from '../alert/alertCapture'
import type { Resolution } from '../alert/alertHistory'
import type { AlertView, AlertViewChunk } from './alertView'

// Simulated alert for /alerta/demo (classroom presentation), evolving in real time:
// positions every 5 s, 20 s audio chunks with their transcripts, a summary that is generated
// and updated, the stop and the "estoy bien". Its timeline is either scripted (starts 40 s
// before the page opens, stops at second 100) or follows a demo alert raised on the watch.

/** When things happen; null = not (yet). */
export type DemoTimeline = {
  startedAt: number
  stoppedAt: number | null
  stopReason: StopReason | null
  resolution: Resolution | null
  resolvedAt: number | null
}

const START_OFFSET_S = 40
const STOP_AT_S = 100
const CHUNK_S = 20
const TRANSCRIBE_DELAY_S = 6
const SUMMARY_DELAY_S = 4
/** Laura says "estoy bien" a little after the final summary. */
const RESOLVED_AT_S = 135

const transcripts = [
  'Ya salí de clase, voy caminando hacia la estación. Hay un carro que lleva rato detrás de mí.',
  '¿Qué necesita? No, no tengo nada. Por favor déjeme pasar.',
  'Sigo caminando, el hombre se bajó del carro y me está siguiendo.',
  'Estoy llegando a la calle 10, voy a entrar a la tienda de la esquina.',
  'Ya estoy dentro de la tienda, le pedí ayuda al señor de la caja.',
]

const summaries = [
  'Laura camina hacia la estación y nota un carro que la sigue.',
  'Un hombre la aborda y ella le pide que la deje pasar; luego la sigue a pie. Se dirige a la calle 10.',
  'Un hombre en carro siguió a Laura y la abordó en la calle. Ella se refugió en una tienda de la calle 10 y pidió ayuda; por ahora está acompañada.',
]

// A short walk through El Poblado, Medellín.
const route: [number, number][] = [
  [6.20895, -75.56781],
  [6.20861, -75.56722],
  [6.20823, -75.56664],
  [6.20787, -75.56601],
  [6.20752, -75.56548],
  [6.20713, -75.56497],
  [6.2068, -75.56452],
]

/** Scripted alert for a page opened at `openedAt`. */
export function scriptedTimeline(openedAt: number): DemoTimeline {
  const startedAt = openedAt - START_OFFSET_S * 1000
  return {
    startedAt,
    stoppedAt: startedAt + STOP_AT_S * 1000,
    stopReason: 'user',
    resolution: 'safe',
    resolvedAt: startedAt + RESOLVED_AT_S * 1000,
  }
}

function positionAt(seconds: number, startedAt: number): LocationFix {
  // The walk takes STOP_AT_S seconds; a longer live alert stays at its end.
  const progress = Math.min(seconds / STOP_AT_S, 1) * (route.length - 1)
  const from = route[Math.floor(progress)]
  const to = route[Math.min(Math.floor(progress) + 1, route.length - 1)]
  const t = progress - Math.floor(progress)
  return {
    latitude: from[0] + (to[0] - from[0]) * t,
    longitude: from[1] + (to[1] - from[1]) * t,
    accuracy: 12 + (seconds % 7),
    time: startedAt + seconds * 1000,
  }
}

/** The demo alert as it looks `now`. */
export function demoAlertView(timeline: DemoTimeline, now: number): AlertView {
  const { startedAt } = timeline
  const elapsed = Math.max(0, (now - startedAt) / 1000)
  const stopAtS = timeline.stoppedAt !== null ? (timeline.stoppedAt - startedAt) / 1000 : Infinity
  const stopped = elapsed >= stopAtS
  const recorded = Math.min(elapsed, stopAtS)

  const locations: LocationFix[] = []
  for (let s = 0; s <= recorded; s += 5) locations.push(positionAt(s, startedAt))

  // A chunk exists once it is complete (and the last partial one once stopped).
  const chunkCount = stopped ? Math.ceil(stopAtS / CHUNK_S) : Math.floor(recorded / CHUNK_S)
  const chunks: AlertViewChunk[] = Array.from({ length: chunkCount }, (_, index) => {
    const endsAt = Math.min((index + 1) * CHUNK_S, stopAtS)
    const done = elapsed >= endsAt + TRANSCRIBE_DELAY_S
    return {
      index,
      durationMs: (endsAt - index * CHUNK_S) * 1000,
      transcript: done ? transcripts[index % transcripts.length] : null,
      transcriptStatus: done ? 'done' : 'pending',
      audioUrl: null,
    }
  })

  const transcribed = chunks.filter((chunk) => chunk.transcriptStatus === 'done').length
  const lastTranscribedAt = transcribed > 0 ? Math.min(transcribed * CHUNK_S, stopAtS) + TRANSCRIBE_DELAY_S : 0
  const generating = transcribed > 0 && elapsed < lastTranscribedAt + SUMMARY_DELAY_S
  const summaryIndex = Math.min(Math.max(transcribed - (generating ? 2 : 1), -1), summaries.length - 1)
  const allDone = stopped && transcribed === chunks.length && !generating
  const resolved = timeline.resolvedAt !== null && now >= timeline.resolvedAt

  return {
    id: 'demo',
    status: stopped ? 'stopped' : 'active',
    ownerName: 'Laura',
    message: 'Si recibes esto, llámame. Estoy saliendo de la universidad.',
    startedAt,
    stoppedAt: stopped ? timeline.stoppedAt : null,
    stopReason: stopped ? (timeline.stopReason ?? 'user') : null,
    lastLocation: locations.at(-1) ?? null,
    locations,
    // A short live alert ends with the summary of what it managed to record.
    summary: allDone ? (summaries[Math.min(transcribed, summaries.length) - 1] ?? null) : summaryIndex >= 0 ? summaries[summaryIndex] : null,
    summaryStatus: allDone ? 'ready' : generating ? 'generating' : summaryIndex >= 0 ? 'ready' : 'waiting',
    summaryUpdatedAt: summaryIndex >= 0 || allDone ? startedAt + (lastTranscribedAt + SUMMARY_DELAY_S) * 1000 : null,
    chunks,
    resolution: resolved ? timeline.resolution : null,
    resolvedAt: resolved ? timeline.resolvedAt : null,
  }
}
