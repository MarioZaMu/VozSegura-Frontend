package com.vozsegura.wear.presentation.debug

import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.wear.compose.material3.Text
import com.vozsegura.wear.R
import com.vozsegura.wear.haptics.HapticSignal
import com.vozsegura.wear.presentation.theme.StealthColors
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow

@StringRes
private fun HapticSignal.debugLabel(): Int = when (this) {
    HapticSignal.DETECTED -> R.string.debug_haptic_detected
    HapticSignal.SENT -> R.string.debug_haptic_sent
    HapticSignal.ERROR -> R.string.debug_haptic_error
    HapticSignal.CANCELLED -> R.string.debug_haptic_cancelled
}

/**
 * DEBUG BUILDS ONLY. The emulator cannot vibrate, so this briefly prints each haptic signal
 * near the top edge. It breaks stealth on purpose and must never ship in a release build.
 */
@Composable
fun HapticEchoOverlay(signals: Flow<HapticSignal>) {
    var current by remember { mutableStateOf<HapticSignal?>(null) }
    LaunchedEffect(signals) {
        signals.collect { current = it }
    }
    LaunchedEffect(current) {
        if (current != null) {
            delay(ECHO_DURATION_MS)
            current = null
        }
    }
    val signal = current ?: return
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.TopCenter) {
        Text(
            text = stringResource(signal.debugLabel()),
            color = StealthColors.TextSecondary,
            fontSize = 11.sp,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 28.dp, start = 40.dp, end = 40.dp),
        )
    }
}

private const val ECHO_DURATION_MS = 1_800L
