package com.vozsegura.wear.alert

import com.vozsegura.shared.model.AlertState
import com.vozsegura.wear.haptics.HapticSignal

/** Watch-side alert lifecycle. Richer than [AlertState]: it includes the silent grace window. */
sealed interface AlertPhase {
    data object Idle : AlertPhase

    /** Double tap detected; nothing sent yet. A long press here cancels with no trace. */
    data object Arming : AlertPhase

    /** Grace window elapsed: recording + location, delivery in flight. */
    data object Delivering : AlertPhase

    data object Sent : AlertPhase

    /** Delivery failed; retrying silently. Only the first failure vibrates. */
    data class Failed(val attempts: Int) : AlertPhase

    data object Cancelled : AlertPhase
}

fun AlertPhase.toAlertState(): AlertState = when (this) {
    AlertPhase.Idle, AlertPhase.Arming -> AlertState.IDLE
    AlertPhase.Delivering -> AlertState.ACTIVATED
    AlertPhase.Sent -> AlertState.SENT
    is AlertPhase.Failed -> AlertState.ERROR
    AlertPhase.Cancelled -> AlertState.CANCELLED
}

sealed interface AlertEvent {
    data object DoubleTap : AlertEvent
    data object LongPress : AlertEvent
    data object GraceElapsed : AlertEvent
    data object DeliverySucceeded : AlertEvent
    data object DeliveryFailed : AlertEvent
    data object RetryElapsed : AlertEvent
    data object ResetElapsed : AlertEvent
}

/** Side effects the controller must run after a transition. */
sealed interface AlertEffect {
    data class Vibrate(val signal: HapticSignal) : AlertEffect
    /** Start the foreground service and begin looking up the location. */
    data object StartSession : AlertEffect
    data object StartGraceTimer : AlertEffect
    data object StartDelivery : AlertEffect
    data object StartRetryTimer : AlertEffect
    /** Tell contacts "alerta cancelada: estoy bien". Only after something may have been sent. */
    data object SendCancellation : AlertEffect
    /** Stop timers, delivery, recording and the foreground service. */
    data object StopAll : AlertEffect
    data object StartResetTimer : AlertEffect
}

data class Transition(val phase: AlertPhase, val effects: List<AlertEffect> = emptyList())

/**
 * Pure transition table. Rule of thumb for cancelling: before the grace window ends nothing
 * left the watch, so cancel is silent; after it, contacts always get a cancellation notice.
 */
object AlertStateMachine {

    fun reduce(phase: AlertPhase, event: AlertEvent): Transition = when (phase) {
        AlertPhase.Idle -> when (event) {
            AlertEvent.DoubleTap -> Transition(
                AlertPhase.Arming,
                listOf(
                    AlertEffect.Vibrate(HapticSignal.DETECTED),
                    AlertEffect.StartSession,
                    AlertEffect.StartGraceTimer,
                ),
            )
            else -> Transition(phase)
        }

        AlertPhase.Arming -> when (event) {
            AlertEvent.GraceElapsed -> Transition(AlertPhase.Delivering, listOf(AlertEffect.StartDelivery))
            AlertEvent.LongPress -> cancel(notifyContacts = false)
            else -> Transition(phase)
        }

        AlertPhase.Delivering -> when (event) {
            AlertEvent.DeliverySucceeded -> Transition(
                AlertPhase.Sent,
                listOf(AlertEffect.Vibrate(HapticSignal.SENT)),
            )
            AlertEvent.DeliveryFailed -> Transition(
                AlertPhase.Failed(attempts = 1),
                listOf(AlertEffect.Vibrate(HapticSignal.ERROR), AlertEffect.StartRetryTimer),
            )
            AlertEvent.LongPress -> cancel(notifyContacts = true)
            else -> Transition(phase)
        }

        is AlertPhase.Failed -> when (event) {
            AlertEvent.RetryElapsed -> Transition(phase, listOf(AlertEffect.StartDelivery))
            AlertEvent.DeliverySucceeded -> Transition(
                AlertPhase.Sent,
                listOf(AlertEffect.Vibrate(HapticSignal.SENT)),
            )
            AlertEvent.DeliveryFailed -> Transition(
                phase.copy(attempts = phase.attempts + 1),
                listOf(AlertEffect.StartRetryTimer),
            )
            AlertEvent.LongPress -> cancel(notifyContacts = true)
            else -> Transition(phase)
        }

        AlertPhase.Sent -> when (event) {
            AlertEvent.LongPress -> cancel(notifyContacts = true)
            else -> Transition(phase)
        }

        AlertPhase.Cancelled -> when (event) {
            AlertEvent.ResetElapsed -> Transition(AlertPhase.Idle)
            else -> Transition(phase)
        }
    }

    private fun cancel(notifyContacts: Boolean) = Transition(
        AlertPhase.Cancelled,
        buildList {
            add(AlertEffect.StopAll)
            if (notifyContacts) add(AlertEffect.SendCancellation)
            add(AlertEffect.Vibrate(HapticSignal.CANCELLED))
            add(AlertEffect.StartResetTimer)
        },
    )
}
