package com.vozsegura.wear.alert

import com.vozsegura.shared.model.AlertConfig
import com.vozsegura.shared.model.AlertLocation
import com.vozsegura.shared.model.AlertPayload
import com.vozsegura.wear.gesture.HiddenGesture
import com.vozsegura.wear.haptics.Haptics
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Deferred
import kotlinx.coroutines.Job
import kotlinx.coroutines.async
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

/**
 * Runs [AlertStateMachine] and its effects. Lives in the Application so an alert survives the
 * activity being closed; [session] (a foreground service) keeps the process and its
 * microphone/location access alive while an alert runs.
 *
 * Ordering guarantees: location lookup starts at the double tap (overlapping the grace window),
 * the alert is sent as soon as the window ends, and audio is recorded and uploaded separately,
 * so neither GPS nor audio can block or delay the alert.
 */
class AlertController(
    private val scope: CoroutineScope,
    private val gateway: AlertGateway,
    private val haptics: Haptics,
    private val session: AlertSession,
    private val locationProvider: LocationProvider,
    private val recorder: AudioClipRecorder,
    private val alertMessage: () -> String = { AlertConfig.DEFAULT_ALERT_MESSAGE },
    private val graceMs: Long = GRACE_MS,
    private val retryMs: Long = RETRY_MS,
    private val resetMs: Long = RESET_MS,
) {
    private val _phase = MutableStateFlow<AlertPhase>(AlertPhase.Idle)
    val phase: StateFlow<AlertPhase> = _phase.asStateFlow()

    private var timerJob: Job? = null
    private var deliveryJob: Job? = null
    private var captureJob: Job? = null
    private var location: Deferred<AlertLocation?>? = null
    private var captureFinished = false

    private var alertId = ""
    private var createdAtEpochMs = 0L

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
        if (transition.phase == AlertPhase.Sent) endSessionIfIdle()
    }

    private fun run(effect: AlertEffect) {
        when (effect) {
            is AlertEffect.Vibrate -> haptics.play(effect.signal)
            AlertEffect.StartSession -> startSession()
            AlertEffect.StartGraceTimer -> startTimer(graceMs, AlertEvent.GraceElapsed)
            AlertEffect.StartRetryTimer -> startTimer(retryMs, AlertEvent.RetryElapsed)
            AlertEffect.StartResetTimer -> startTimer(resetMs, AlertEvent.ResetElapsed)
            AlertEffect.StartDelivery -> startDelivery()
            AlertEffect.SendCancellation -> {
                val id = alertId
                scope.launch { gateway.sendCancellation(id) }
            }
            AlertEffect.StopAll -> stopAll()
        }
    }

    private fun startSession() {
        alertId = UUID.randomUUID().toString()
        createdAtEpochMs = System.currentTimeMillis()
        captureFinished = false
        // Started at the double tap, while the app is surely in the foreground: Android only
        // grants microphone/location foreground services to apps the user is looking at.
        session.start()
        location = scope.async { locationProvider.currentOrNull() }
    }

    private fun startDelivery() {
        val id = alertId
        // Record once per alert; delivery retries must not restart the clip.
        if (captureJob == null) {
            captureJob = scope.launch {
                recorder.record(id)?.let { clip ->
                    // Privacy: once the backend has the clip, no copy stays on the watch.
                    if (gateway.sendAudio(id, clip)) clip.delete()
                }
                captureFinished = true
                endSessionIfIdle()
            }
        }
        deliveryJob?.cancel()
        deliveryJob = scope.launch {
            val payload = AlertPayload(
                alertId = id,
                createdAtEpochMs = createdAtEpochMs,
                message = alertMessage(),
                location = location?.await(),
            )
            val delivered = gateway.sendAlert(payload)
            dispatch(if (delivered) AlertEvent.DeliverySucceeded else AlertEvent.DeliveryFailed)
        }
    }

    private fun stopAll() {
        timerJob?.cancel()
        deliveryJob?.cancel()
        captureJob?.cancel() // The recorder deletes a partial clip on cancel.
        location?.cancel()
        captureJob = null
        location = null
        session.stop()
    }

    /** Release the microphone and foreground service once the alert is out and the clip uploaded. */
    private fun endSessionIfIdle() {
        if (_phase.value == AlertPhase.Sent && captureFinished) session.stop()
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
