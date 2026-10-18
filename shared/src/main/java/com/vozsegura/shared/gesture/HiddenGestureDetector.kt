package com.vozsegura.shared.gesture

import kotlin.math.hypot

/** Gestures recognized on the stealth watch face. */
enum class HiddenGesture {
    /** Triggers the alert. */
    DOUBLE_TAP,

    /** Cancels the alert (or marks it as a false alarm). */
    LONG_PRESS,
}

/**
 * Thresholds for the hidden trigger. The goal is "invisible but infallible": easy on purpose,
 * hard by accident (sleeve brushes, palm contact, the tap that wakes the screen).
 */
data class GesturePolicy(
    /** A tap longer than this is a press, not a tap. */
    val maxTapDurationMs: Long = 250,
    /** Gaps shorter than this are touch bounce or fabric chatter, not a human double tap. */
    val minTapGapMs: Long = 60,
    val maxTapGapMs: Long = 400,
    /** Movement allowed inside one tap before it counts as a drag. */
    val tapSlopPx: Float,
    /** Both taps must land close together. */
    val maxTapDistancePx: Float,
    /** Contact larger than this is a palm or wrist, not a fingertip. */
    val maxTouchMajorPx: Float,
    /** Shorter than the grace window so a silent cancel is reachable (see the watch AlertController.GRACE_MS). */
    val longPressMs: Long = 2_000,
    /** Ignore touches right after the screen wakes, so the wake tap never counts. */
    val wakeGuardMs: Long = 500,
) {
    companion object {
        private const val MM_PER_INCH = 25.4f
        private const val DP_PER_INCH = 160f

        /** Builds a policy from physical sizes, so it behaves the same on every screen density. */
        fun forDisplay(density: Float, touchSlopPx: Float): GesturePolicy {
            fun mmToPx(mm: Float) = mm / MM_PER_INCH * DP_PER_INCH * density
            return GesturePolicy(
                tapSlopPx = touchSlopPx,
                maxTapDistancePx = mmToPx(10f),
                maxTouchMajorPx = mmToPx(14f),
            )
        }
    }
}

/**
 * Framework-free double-tap / long-press recognizer. Times are monotonic milliseconds
 * (MotionEvent.eventTime), positions are pixels. Fed by the watch HiddenGestureLayer and the phone practice pad; unit-tested directly.
 */
class HiddenGestureDetector(private val policy: GesturePolicy) {

    private data class Tap(val upTimeMs: Long, val x: Float, val y: Float)

    private var tracking = false
    private var rejected = false
    private var moved = false
    private var downTimeMs = 0L
    private var downX = 0f
    private var downY = 0f
    private var previousTap: Tap? = null
    private var guardUntilMs = Long.MIN_VALUE

    val longPressMs: Long get() = policy.longPressMs

    /** Call when the screen becomes interactive (launch or leaving ambient). */
    fun armWakeGuard(nowMs: Long) {
        guardUntilMs = nowMs + policy.wakeGuardMs
        previousTap = null
    }

    fun onDown(x: Float, y: Float, timeMs: Long, pointerCount: Int, touchMajorPx: Float) {
        tracking = true
        moved = false
        downTimeMs = timeMs
        downX = x
        downY = y
        rejected = timeMs < guardUntilMs || isPalm(pointerCount, touchMajorPx)
        if (rejected) previousTap = null
    }

    fun onMove(x: Float, y: Float, pointerCount: Int, touchMajorPx: Float) {
        if (!tracking) return
        if (isPalm(pointerCount, touchMajorPx)) {
            rejected = true
            previousTap = null
        }
        if (hypot(x - downX, y - downY) > policy.tapSlopPx) moved = true
    }

    /** Returns [HiddenGesture.DOUBLE_TAP] when this release completes a valid second tap. */
    fun onUp(x: Float, y: Float, timeMs: Long): HiddenGesture? {
        if (!tracking) return null
        tracking = false
        val isTap = !rejected && !moved && timeMs - downTimeMs <= policy.maxTapDurationMs
        if (!isTap) {
            previousTap = null
            return null
        }
        val first = previousTap
        if (first != null) {
            val gap = downTimeMs - first.upTimeMs
            val distance = hypot(x - first.x, y - first.y)
            if (gap in policy.minTapGapMs..policy.maxTapGapMs && distance <= policy.maxTapDistancePx) {
                previousTap = null
                return HiddenGesture.DOUBLE_TAP
            }
        }
        previousTap = Tap(timeMs, x, y)
        return null
    }

    /** Called by a timer [longPressMs] after a down. Consumes the touch if it fires. */
    fun onLongPressTimeout(nowMs: Long): HiddenGesture? {
        if (!tracking || rejected || moved || nowMs - downTimeMs < policy.longPressMs) return null
        tracking = false
        previousTap = null
        return HiddenGesture.LONG_PRESS
    }

    fun onCancel() {
        tracking = false
        previousTap = null
    }

    private fun isPalm(pointerCount: Int, touchMajorPx: Float) =
        pointerCount > 1 || touchMajorPx > policy.maxTouchMajorPx
}
