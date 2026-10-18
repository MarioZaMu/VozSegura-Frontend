package com.vozsegura.mobile.ui.screens

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.vozsegura.mobile.R
import com.vozsegura.mobile.ui.components.GesturePad
import com.vozsegura.mobile.ui.components.ProgressRing
import com.vozsegura.mobile.ui.components.SectionTitle
import com.vozsegura.mobile.ui.components.VsButton
import com.vozsegura.mobile.ui.components.VsButtonVariant
import com.vozsegura.mobile.ui.components.VsCard
import com.vozsegura.mobile.ui.components.VsScreen
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsSpacing
import com.vozsegura.shared.gesture.HiddenGesture

/** Mirrors the watch AlertController.GRACE_MS: the time to cancel before anything is sent. */
private const val GRACE_MS = 4_000

private enum class PracticePhase { WAITING, ARMED, WOULD_SEND, CANCELLED }

/** Rehearses the real flow (double tap, grace window, long-press cancel) without sending anything. */
@Composable
fun GestureTestScreen(onBack: () -> Unit) {
    var phase by rememberSaveable { mutableStateOf(PracticePhase.WAITING) }
    var successes by rememberSaveable { mutableIntStateOf(0) }
    val grace = remember { Animatable(0f) }
    val haptics = LocalHapticFeedback.current
    val padDescription = stringResource(R.string.gesture_pad_description)

    LaunchedEffect(phase) {
        when (phase) {
            PracticePhase.ARMED -> {
                grace.snapTo(0f)
                grace.animateTo(1f, tween(GRACE_MS, easing = LinearEasing))
                phase = PracticePhase.WOULD_SEND
                haptics.performHapticFeedback(HapticFeedbackType.Confirm)
            }
            PracticePhase.WAITING -> grace.snapTo(0f)
            else -> Unit
        }
    }

    VsScreen(
        title = stringResource(R.string.gesture_title),
        subtitle = stringResource(R.string.gesture_subtitle),
        onBack = onBack,
    ) {
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
            ProgressRing(
                progress = when (phase) {
                    PracticePhase.ARMED -> grace.value
                    PracticePhase.WOULD_SEND -> 1f
                    else -> 0f
                },
                size = 260.dp,
                animated = false,
            ) {
                GesturePad(
                    onGesture = { gesture ->
                        when {
                            gesture == HiddenGesture.DOUBLE_TAP && phase != PracticePhase.ARMED -> {
                                successes++
                                phase = PracticePhase.ARMED
                                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                            }
                            gesture == HiddenGesture.LONG_PRESS && phase == PracticePhase.ARMED -> {
                                phase = PracticePhase.CANCELLED
                                haptics.performHapticFeedback(HapticFeedbackType.Reject)
                            }
                        }
                    },
                    modifier = Modifier
                        .size(216.dp)
                        // With TalkBack on, the screen reader takes over taps, so the pad
                        // explains the gesture instead of pretending to be a button.
                        .semantics { contentDescription = padDescription }
                        .background(VsColors.Surface, CircleShape)
                        .border(1.dp, VsColors.Outline, CircleShape),
                ) {
                    Text(
                        text = stringResource(
                            if (phase == PracticePhase.ARMED) R.string.gesture_pad_armed else R.string.gesture_pad_idle,
                        ),
                        style = MaterialTheme.typography.titleMedium,
                        textAlign = TextAlign.Center,
                        color = VsColors.TextSecondary,
                        modifier = Modifier
                            .align(Alignment.Center)
                            .padding(VsSpacing.xl),
                    )
                }
            }
        }

        Text(
            stringResource(R.string.gesture_successes, successes),
            style = MaterialTheme.typography.labelLarge,
            color = VsColors.TextSecondary,
            modifier = Modifier.fillMaxWidth(),
            textAlign = TextAlign.Center,
        )

        when (phase) {
            PracticePhase.ARMED ->
                Feedback(R.string.gesture_detected_title, R.string.gesture_detected_body, VsColors.PrimaryLight)
            PracticePhase.WOULD_SEND ->
                Feedback(R.string.gesture_sent_title, R.string.gesture_sent_body, VsColors.Success)
            PracticePhase.CANCELLED ->
                Feedback(R.string.gesture_cancelled_title, R.string.gesture_cancelled_body, VsColors.Warning)
            PracticePhase.WAITING -> Unit
        }
        if (phase == PracticePhase.WOULD_SEND || phase == PracticePhase.CANCELLED) {
            VsButton(
                text = stringResource(R.string.gesture_reset),
                onClick = { phase = PracticePhase.WAITING },
                variant = VsButtonVariant.SECONDARY,
            )
        }

        SectionTitle(stringResource(R.string.gesture_tips_title))
        VsCard(modifier = Modifier.fillMaxWidth()) {
            listOf(R.string.gesture_tip1, R.string.gesture_tip2, R.string.gesture_tip3).forEach { tip ->
                Text("•  " + stringResource(tip), style = MaterialTheme.typography.bodyMedium)
                Spacer(Modifier.height(VsSpacing.xs))
            }
        }
    }
}

@Composable
private fun Feedback(title: Int, body: Int, color: Color) {
    VsCard(
        // Announced as soon as it changes, so the result is not conveyed only by color and motion.
        modifier = Modifier
            .fillMaxWidth()
            .semantics(mergeDescendants = true) { liveRegion = LiveRegionMode.Polite },
        color = color.copy(alpha = 0.12f),
    ) {
        Text(stringResource(title), style = MaterialTheme.typography.titleMedium, color = color)
        Spacer(Modifier.height(VsSpacing.xxs))
        Text(stringResource(body), style = MaterialTheme.typography.bodyMedium)
    }
}
