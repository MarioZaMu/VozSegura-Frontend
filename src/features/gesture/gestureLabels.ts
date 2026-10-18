import type { Messages } from '../../i18n/messages'
import type { GestureEvent } from './doubleTapDetector'

// How each touch was interpreted, shown in diagnostics and gesture practice.
export function describeGestureEvent(event: GestureEvent, t: Messages): string {
  switch (event.type) {
    case 'tap':
      return t.gesture.tap
    case 'double-tap':
      return t.gesture.doubleTap
    case 'triple-tap':
      return t.gesture.tripleTap
    case 'rejected':
      return t.gesture.rejections[event.reason]
  }
}
