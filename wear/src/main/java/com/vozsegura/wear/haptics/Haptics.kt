package com.vozsegura.wear.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

/**
 * Discreet haptic vocabulary: short, medium-strength pulses that can be told apart by feel
 * without looking at the screen. Timings alternate off/on in milliseconds.
 */
enum class HapticSignal(val timingsMs: LongArray) {
    /** One tick: double tap recognized, 4 s grace window running. */
    DETECTED(longArrayOf(0, 30)),

    /** Two ticks: alert delivered to contacts. */
    SENT(longArrayOf(0, 30, 120, 30)),

    /** One long buzz: delivery failed, retrying silently. */
    ERROR(longArrayOf(0, 450)),

    /** Three quick ticks: alert cancelled. */
    CANCELLED(longArrayOf(0, 30, 90, 30, 90, 30)),
}

class Haptics(context: Context) {

    private val vibrator: Vibrator =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            context.getSystemService(VibratorManager::class.java).defaultVibrator
        } else {
            @Suppress("DEPRECATION")
            context.getSystemService(Vibrator::class.java)
        }

    private val _played = MutableSharedFlow<HapticSignal>(extraBufferCapacity = 4)

    /** Every signal played; lets debug builds echo haptics on the emulator, which cannot vibrate. */
    val played: SharedFlow<HapticSignal> = _played.asSharedFlow()

    fun play(signal: HapticSignal) {
        _played.tryEmit(signal)
        if (!vibrator.hasVibrator()) return
        val timings = signal.timingsMs
        val effect = if (vibrator.hasAmplitudeControl()) {
            // Off segments at 0, on segments at ~60% strength: felt on the wrist, barely audible.
            val amplitudes = IntArray(timings.size) { index -> if (index % 2 == 0) 0 else PULSE_AMPLITUDE }
            VibrationEffect.createWaveform(timings, amplitudes, NO_REPEAT)
        } else {
            VibrationEffect.createWaveform(timings, NO_REPEAT)
        }
        vibrator.vibrate(effect)
    }

    private companion object {
        const val PULSE_AMPLITUDE = 150
        const val NO_REPEAT = -1
    }
}
