package com.vozsegura.wear.alert

import com.vozsegura.wear.gesture.HiddenGesture
import com.vozsegura.wear.haptics.Haptics
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

/**
 * Runs [AlertStateMachine] and its effects. Lives in the Application so an alert survives the
 * activity being closed; phase 5 moves delivery and recording into a foreground service.
 */
class AlertController(
    private val scope: CoroutineScope,
    private val gateway: AlertGateway,
    private val haptics: Haptics,
    private val graceMs: Long = GRACE_MS,
    private val retryMs: Long = RETRY_MS,
    private val resetMs: Long = RESET_MS,
) {
    private val _phase = MutableStateFlow<AlertPhase>(AlertPhase.Idle)
    val phase: StateFlow<AlertPhase> = _phase.asStateFlow()

    private var timerJob: Job? = null
    private var deliveryJob: Job? = null

    fun onGesture(gesture: HiddenGesture) = dispatch(
        when (gesture) {
            HiddenGesture.DOUBLE_TAP -> AlertEvent.DoubleTap
            HiddenGesture.LONG_PRESS -> AlertEvent.LongPress
        },
    )

    private fun dispatch(event: AlertEvent) {
        val transition = AlertStateMachine.reduce(_phase.value, event)
        _phase.value = transition.phase
        transition.effects.forEach(::run)
    }

    private fun run(effect: AlertEffect) {
        when (effect) {
            is AlertEffect.Vibrate -> haptics.play(effect.signal)
            AlertEffect.StartGraceTimer -> startTimer(graceMs, AlertEvent.GraceElapsed)
            AlertEffect.StartRetryTimer -> startTimer(retryMs, AlertEvent.RetryElapsed)
            AlertEffect.StartResetTimer -> startTimer(resetMs, AlertEvent.ResetElapsed)
            AlertEffect.StartDelivery -> {
                deliveryJob?.cancel()
                deliveryJob = scope.launch {
                    val delivered = gateway.sendAlert()
                    dispatch(if (delivered) AlertEvent.DeliverySucceeded else AlertEvent.DeliveryFailed)
                }
            }
            AlertEffect.SendCancellation -> scope.launch { gateway.sendCancellation() }
            AlertEffect.StopAll -> {
                timerJob?.cancel()
                deliveryJob?.cancel()
            }
        }
    }

    private fun startTimer(durationMs: Long, event: AlertEvent) {
        timerJob?.cancel()
        timerJob = scope.launch {
            delay(durationMs)
            dispatch(event)
        }
    }

    companion object {
        /**
         * Silent window to undo an accidental double tap before anything leaves the watch.
         * Must exceed the 2 s cancel hold plus reaction time, or a silent cancel is impossible.
         */
        const val GRACE_MS = 4_000L
        const val RETRY_MS = 5_000L
        /** Short cool-down so frantic taps right after cancelling do not re-arm instantly. */
        const val RESET_MS = 2_000L
    }
}
