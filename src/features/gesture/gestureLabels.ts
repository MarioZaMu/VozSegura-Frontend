import type { GestureEvent, TapRejection } from './doubleTapDetector'

// Spanish explanations of each rejection, shown in diagnostics and gesture practice.
export const rejectionLabels: Record<TapRejection, string> = {
  'not-armed': 'Ignorado: la pantalla se acaba de mostrar',
  cooldown: 'Ignorado: la alerta se acaba de activar',
  'multi-touch': 'Rechazado: más de un dedo',
  palm: 'Rechazado: contacto muy grande (palma)',
  moved: 'Rechazado: el dedo se deslizó',
  'long-press': 'Rechazado: toque demasiado largo',
  'too-fast': 'Rechazado: segundo toque demasiado rápido',
  'too-far': 'Rechazado: toques muy separados',
}

export function describeGestureEvent(event: GestureEvent): string {
  switch (event.type) {
    case 'tap':
      return 'Primer toque'
    case 'double-tap':
      return 'Doble toque reconocido'
    case 'rejected':
      return rejectionLabels[event.reason]
  }
}
