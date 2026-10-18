package com.vozsegura.mobile.ui.components

import android.os.SystemClock
import android.view.MotionEvent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.runtime.Composable
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
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Practice area driven by the same [HiddenGestureDetector] and thresholds as the watch, so what
 * works here works on the wrist. Like the watch layer, it reads raw MotionEvents for palm rejection.
 */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
fun GesturePad(
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
    val scope = rememberCoroutineScope()
    val longPressTimer = remember(scope) { LongPressTimer(scope) }

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
