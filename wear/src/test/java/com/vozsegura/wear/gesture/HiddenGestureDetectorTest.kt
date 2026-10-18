package com.vozsegura.wear.gesture

import com.vozsegura.shared.gesture.GesturePolicy
import com.vozsegura.shared.gesture.HiddenGesture
import com.vozsegura.shared.gesture.HiddenGestureDetector
import com.vozsegura.wear.alert.AlertController
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class HiddenGestureDetectorTest {

    private val policy = GesturePolicy(
        tapSlopPx = 10f,
        maxTapDistancePx = 60f,
        maxTouchMajorPx = 80f,
    )
    private lateinit var detector: HiddenGestureDetector

    @Before
    fun setUp() {
        detector = HiddenGestureDetector(policy)
    }

    /** One tap: down at [downMs], up [durationMs] later. Returns the gesture from the release. */
    private fun tap(
        downMs: Long,
        x: Float = 100f,
        y: Float = 100f,
        durationMs: Long = 80,
        pointers: Int = 1,
        touchMajor: Float = 20f,
    ): HiddenGesture? {
        detector.onDown(x, y, downMs, pointers, touchMajor)
        return detector.onUp(x, y, downMs + durationMs)
    }

    @Test
    fun `two quick taps close together trigger a double tap`() {
        assertNull(tap(downMs = 1_000))
        assertEquals(HiddenGesture.DOUBLE_TAP, tap(downMs = 1_250))
    }

    @Test
    fun `single tap does nothing`() {
        assertNull(tap(downMs = 1_000))
    }

    @Test
    fun `taps too far apart in time are rejected`() {
        tap(downMs = 1_000)
        assertNull(tap(downMs = 1_000 + 80 + 401))
    }

    @Test
    fun `taps closer than the bounce threshold are rejected`() {
        tap(downMs = 1_000)
        assertNull(tap(downMs = 1_000 + 80 + 30))
    }

    @Test
    fun `taps far apart on screen are rejected`() {
        tap(downMs = 1_000, x = 50f)
        assertNull(tap(downMs = 1_250, x = 200f))
    }

    @Test
    fun `a long touch is not a tap`() {
        tap(downMs = 1_000)
        assertNull(tap(downMs = 1_250, durationMs = 400))
    }

    @Test
    fun `palm contact is rejected`() {
        tap(downMs = 1_000)
        assertNull(tap(downMs = 1_250, touchMajor = 200f))
    }

    @Test
    fun `two fingers are rejected`() {
        tap(downMs = 1_000)
        assertNull(tap(downMs = 1_250, pointers = 2))
    }

    @Test
    fun `dragging during a tap cancels it`() {
        tap(downMs = 1_000)
        detector.onDown(100f, 100f, 1_250, 1, 20f)
        detector.onMove(140f, 100f, 1, 20f)
        assertNull(detector.onUp(140f, 100f, 1_300))
    }

    @Test
    fun `the tap that wakes the screen never counts`() {
        detector.armWakeGuard(nowMs = 1_000)
        assertNull(tap(downMs = 1_100))
        assertNull(tap(downMs = 1_350))
        // After the guard, a fresh pair works.
        assertNull(tap(downMs = 2_000))
        assertEquals(HiddenGesture.DOUBLE_TAP, tap(downMs = 2_250))
    }

    @Test
    fun `a triple tap fires only once`() {
        tap(downMs = 1_000)
        assertEquals(HiddenGesture.DOUBLE_TAP, tap(downMs = 1_250))
        assertNull(tap(downMs = 1_500))
    }

    @Test
    fun `holding still for the full duration is a long press`() {
        detector.onDown(100f, 100f, 1_000, 1, 20f)
        assertNull(detector.onLongPressTimeout(nowMs = 2_500))
        assertEquals(HiddenGesture.LONG_PRESS, detector.onLongPressTimeout(nowMs = 3_000))
        // The release after a long press must not also count as a tap.
        assertNull(detector.onUp(100f, 100f, 3_100))
    }

    @Test
    fun `moving during a long press cancels it`() {
        detector.onDown(100f, 100f, 1_000, 1, 20f)
        detector.onMove(150f, 100f, 1, 20f)
        assertNull(detector.onLongPressTimeout(nowMs = 4_000))
    }

    @Test
    fun `a resting palm never becomes a long press`() {
        detector.onDown(100f, 100f, 1_000, 1, 200f)
        assertNull(detector.onLongPressTimeout(nowMs = 4_000))
    }

    @Test
    fun `a silent cancel fits inside the grace window with time to react`() {
        val reactionBudgetMs = AlertController.GRACE_MS - GesturePolicy(
            tapSlopPx = 0f, maxTapDistancePx = 0f, maxTouchMajorPx = 0f,
        ).longPressMs
        assertTrue("only $reactionBudgetMs ms to start holding", reactionBudgetMs >= 1_500)
    }
}
