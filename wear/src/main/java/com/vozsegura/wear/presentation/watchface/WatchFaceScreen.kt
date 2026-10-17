package com.vozsegura.wear.presentation.watchface

import android.text.format.DateFormat
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material3.Text
import androidx.wear.compose.ui.tooling.preview.WearPreviewDevices
import com.vozsegura.wear.presentation.ambient.AmbientMode
import com.vozsegura.wear.presentation.ambient.LocalAmbientState
import com.vozsegura.wear.presentation.theme.StealthColors
import com.vozsegura.wear.presentation.theme.WatchDimens
import com.vozsegura.wear.presentation.theme.WatchFaceType
import com.vozsegura.wear.presentation.theme.scaled
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale
import kotlin.math.roundToInt
import kotlin.random.Random

private val spanish: Locale = Locale.forLanguageTag("es")
private val time24Formatter = DateTimeFormatter.ofPattern("HH:mm", spanish)
private val time12Formatter = DateTimeFormatter.ofPattern("h:mm", spanish)
private val periodFormatter = DateTimeFormatter.ofPattern("a", spanish)
private val dateFormatter = DateTimeFormatter.ofPattern("EEE, d MMM", spanish)

/**
 * Idle watch face: looks like a stock digital face (time, date, battery) and nothing else.
 * It renders the same in every alert state; the panic trigger is added in phase 4.
 */
@Composable
fun WatchFaceScreen() {
    val ambientState = LocalAmbientState.current
    val now = rememberCurrentTime(refreshKey = ambientState.tick)
    WatchFaceContent(
        now = now,
        // Re-read on every minute recomposition so a settings change applies without restart.
        use24Hour = DateFormat.is24HourFormat(LocalContext.current),
        batteryPercent = rememberBatteryPercent(),
        ambientMode = ambientState.mode,
        isRound = LocalConfiguration.current.isScreenRound,
    )
}

@Composable
internal fun WatchFaceContent(
    now: LocalDateTime,
    use24Hour: Boolean,
    batteryPercent: Int,
    ambientMode: AmbientMode,
    isRound: Boolean,
) {
    BoxWithConstraints(
        modifier = Modifier
            .fillMaxSize()
            .background(StealthColors.Background),
    ) {
        val scale = maxWidth / WatchDimens.referenceScreen
        // The time is already huge: ignore the user's font scale so it never overflows the face.
        val timeScale = scale / LocalDensity.current.fontScale
        val ambient = ambientMode as? AmbientMode.Ambient
        val edgeMargin = if (isRound) maxWidth * WatchDimens.ROUND_EDGE_FRACTION else WatchDimens.squareGutter

        // Low-bit ambient panels cannot draw greys, so everything becomes pure white there.
        val primaryColor = when {
            ambient == null -> StealthColors.TextPrimary
            ambient.lowBitAmbient -> Color.White
            else -> StealthColors.AmbientText
        }
        val secondaryColor = when {
            ambient == null -> StealthColors.TextSecondary
            ambient.lowBitAmbient -> Color.White
            else -> StealthColors.AmbientText
        }

        val maxShiftPx = with(LocalDensity.current) { (maxWidth * WatchDimens.BURN_IN_SHIFT_FRACTION).toPx() }
        val burnInOffset = remember(now, ambient) {
            if (ambient?.burnInProtectionRequired == true) {
                val range = maxShiftPx.roundToInt()
                IntOffset(Random.nextInt(-range, range + 1), Random.nextInt(-range, range + 1))
            } else {
                IntOffset.Zero
            }
        }

        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .offset { burnInOffset },
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            HangingSuffix(
                suffix = {
                    if (!use24Hour) {
                        Text(
                            text = now.format(periodFormatter),
                            style = WatchFaceType.Period.scaled(scale),
                            color = secondaryColor,
                            modifier = Modifier.padding(start = 3.dp * scale, top = 10.dp * scale),
                        )
                    }
                },
            ) {
                Text(
                    text = now.format(if (use24Hour) time24Formatter else time12Formatter),
                    style = (if (ambient != null) WatchFaceType.TimeAmbient else WatchFaceType.Time)
                        .scaled(timeScale),
                    color = primaryColor,
                )
            }
            Text(
                text = now.format(dateFormatter).replaceFirstChar { it.titlecase(spanish) },
                style = WatchFaceType.Date.scaled(scale),
                color = secondaryColor,
            )
        }

        // Ambient hides secondary info, as stock faces do, to save power.
        if (ambient == null) {
            BatteryIndicator(
                percent = batteryPercent,
                color = secondaryColor,
                textStyle = WatchFaceType.Complication.scaled(scale),
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = edgeMargin),
            )
        }
    }
}

/**
 * Lays out [content] and hangs [suffix] off its top-right corner without counting the
 * suffix width, so the time stays optically centered whether or not "p. m." is shown.
 */
@Composable
private fun HangingSuffix(suffix: @Composable () -> Unit, content: @Composable () -> Unit) {
    Layout(contents = listOf(content, suffix)) { (contentMeasurables, suffixMeasurables), constraints ->
        val loose = constraints.copy(minWidth = 0, minHeight = 0)
        val main = contentMeasurables.first().measure(loose)
        val hanging = suffixMeasurables.firstOrNull()?.measure(loose)
        layout(main.width, main.height) {
            main.place(0, 0)
            hanging?.place(main.width, 0)
        }
    }
}

private val previewTime = LocalDateTime.of(2026, 10, 17, 20, 27)

@WearPreviewDevices
@Composable
private fun WatchFaceInteractivePreview() {
    WatchFaceContent(
        now = previewTime,
        use24Hour = true,
        batteryPercent = 82,
        ambientMode = AmbientMode.Interactive,
        isRound = LocalConfiguration.current.isScreenRound,
    )
}

@WearPreviewDevices
@Composable
private fun WatchFace12HourPreview() {
    WatchFaceContent(
        now = previewTime,
        use24Hour = false,
        batteryPercent = 82,
        ambientMode = AmbientMode.Interactive,
        isRound = LocalConfiguration.current.isScreenRound,
    )
}

@WearPreviewDevices
@Composable
private fun WatchFaceAmbientPreview() {
    WatchFaceContent(
        now = previewTime,
        use24Hour = true,
        batteryPercent = 82,
        ambientMode = AmbientMode.Ambient(burnInProtectionRequired = false, lowBitAmbient = false),
        isRound = LocalConfiguration.current.isScreenRound,
    )
}
