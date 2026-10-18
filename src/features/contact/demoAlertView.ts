import type { LocationFix } from '../alert/alertCapture'
import type { AlertView, AlertViewChunk } from './alertView'

// Simulated alert for /alerta/demo (classroom presentation): it starts 40 s before the page
// opens and evolves in real time — positions every 5 s, a 20 s audio chunk with its
// transcript, a summary that is generated and updated, and the stop at second 100.

const START_OFFSET_S = 40
const STOP_AT_S = 100
const CHUNK_S = 20
const TRANSCRIBE_DELAY_S = 6
const SUMMARY_DELAY_S = 4

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

function positionAt(seconds: number, startedAt: number): LocationFix {
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

/** The demo alert as it looks `now`, for a page opened at `openedAt`. */
export function demoAlertView(openedAt: number, now: number): AlertView {
  const startedAt = openedAt - START_OFFSET_S * 1000
  const elapsed = Math.max(0, (now - startedAt) / 1000)
  const stopped = elapsed >= STOP_AT_S
  const recorded = Math.min(elapsed, STOP_AT_S)

  const locations: LocationFix[] = []
  for (let s = 0; s <= recorded; s += 5) locations.push(positionAt(s, startedAt))

  // A chunk exists once it is complete (and the last partial one once stopped).
  const chunkCount = stopped ? Math.ceil(STOP_AT_S / CHUNK_S) : Math.floor(recorded / CHUNK_S)
  const chunks: AlertViewChunk[] = Array.from({ length: chunkCount }, (_, index) => {
    const endsAt = Math.min((index + 1) * CHUNK_S, STOP_AT_S)
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
  const lastTranscribedAt = transcribed > 0 ? Math.min(transcribed * CHUNK_S, STOP_AT_S) + TRANSCRIBE_DELAY_S : 0
  const generating = transcribed > 0 && elapsed < lastTranscribedAt + SUMMARY_DELAY_S
  const summaryIndex = Math.min(Math.max(transcribed - (generating ? 2 : 1), -1), summaries.length - 1)
  const allDone = stopped && transcribed === chunks.length && !generating

  return {
    id: 'demo',
    status: stopped ? 'stopped' : 'active',
    ownerName: 'Laura',
    message: 'Si recibes esto, llámame. Estoy saliendo de la universidad.',
    startedAt,
    stoppedAt: stopped ? startedAt + STOP_AT_S * 1000 : null,
    stopReason: stopped ? 'user' : null,
    lastLocation: locations.at(-1) ?? null,
    locations,
    summary: allDone ? summaries.at(-1)! : summaryIndex >= 0 ? summaries[summaryIndex] : null,
    summaryStatus: allDone ? 'ready' : generating ? 'generating' : summaryIndex >= 0 ? 'ready' : 'waiting',
    summaryUpdatedAt: summaryIndex >= 0 || allDone ? startedAt + (lastTranscribedAt + SUMMARY_DELAY_S) * 1000 : null,
    chunks,
  }
}
