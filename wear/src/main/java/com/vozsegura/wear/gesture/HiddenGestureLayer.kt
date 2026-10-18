package com.vozsegura.wear.gesture

import android.os.SystemClock
import android.view.MotionEvent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.input.pointer.pointerInteropFilter
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.LocalViewConfiguration
import com.vozsegura.shared.gesture.GesturePolicy
import com.vozsegura.shared.gesture.HiddenGesture
import com.vozsegura.shared.gesture.HiddenGestureDetector
import com.vozsegura.wear.presentation.ambient.AmbientMode
import com.vozsegura.wear.presentation.ambient.LocalAmbientState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Full-screen, invisible touch layer that feeds raw MotionEvents to [HiddenGestureDetector].
 * Raw events are needed for pointer count and contact size (palm rejection), which Compose's
 * gesture APIs do not expose. Nothing is drawn: the trigger has no visual affordance by design.
 */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun HiddenGestureLayer(
    onGesture: (HiddenGesture) -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable BoxScope.() -> Unit,
) {
    val density = LocalDensity.current.density
    val touchSlop = LocalViewConfiguration.current.touchSlop
    val detector = remember(density, touchSlop) {
        HiddenGestureDetector(GesturePolicy.forDisplay(density, touchSlop))
    }
    val currentOnGesture by rememberUpdatedState(onGesture)
    val longPressTimer = rememberLongPressTimer(rememberCoroutineScope())

    val ambientMode = LocalAmbientState.current.mode
    LaunchedEffect(ambientMode, detector) {
        if (ambientMode is AmbientMode.Interactive) detector.armWakeGuard(SystemClock.uptimeMillis())
    }

    Box(
        modifier = modifier.pointerInteropFilter { event ->
            when (event.actionMasked) {
                MotionEvent.ACTION_DOWN -> {
                    detector.onDown(event.x, event.y, event.eventTime, event.pointerCount, event.touchMajor)
                    longPressTimer.start(detector.longPressMs) {
                        detector.onLongPressTimeout(SystemClock.uptimeMillis())?.let(currentOnGesture)
                    }
                }
                MotionEvent.ACTION_POINTER_DOWN, MotionEvent.ACTION_MOVE ->
                    detector.onMove(event.x, event.y, event.pointerCount, event.touchMajor)
                MotionEvent.ACTION_UP -> {
                    longPressTimer.cancel()
                    detector.onUp(event.x, event.y, event.eventTime)?.let(currentOnGesture)
                }
                MotionEvent.ACTION_CANCEL -> {
                    longPressTimer.cancel()
                    detector.onCancel()
                }
            }
            true
        },
        content = content,
    )
}

@Composable
private fun rememberLongPressTimer(scope: CoroutineScope): LongPressTimer = remember(scope) { LongPressTimer(scope) }

private class LongPressTimer(private val scope: CoroutineScope) {
    private var job: Job? = null

    fun start(delayMs: Long, onTimeout: () -> Unit) {
        job?.cancel()
        job = scope.launch {
            delay(delayMs)
            onTimeout()
        }
    }

    fun cancel() {
        job?.cancel()
    }
}
