package com.vozsegura.mobile.ui.components

import androidx.annotation.StringRes
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.vozsegura.mobile.R
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsRadius
import com.vozsegura.mobile.ui.theme.VsSpacing
import com.vozsegura.shared.model.AlertState

/** Visual spec of each alert state on the phone. The watch never shows these (stealth). */
data class AlertStateStyle(@param:StringRes val labelRes: Int, val color: Color)

fun AlertState.style(): AlertStateStyle = when (this) {
    AlertState.IDLE -> AlertStateStyle(R.string.alert_state_idle, VsColors.TextSecondary)
    AlertState.ACTIVATED -> AlertStateStyle(R.string.alert_state_activated, VsColors.PrimaryLight)
    AlertState.SENT -> AlertStateStyle(R.string.alert_state_sent, VsColors.Success)
    AlertState.ERROR -> AlertStateStyle(R.string.alert_state_error, VsColors.Danger)
    AlertState.CANCELLED -> AlertStateStyle(R.string.alert_state_cancelled, VsColors.Warning)
}

/** Pill with a colored dot + label. Color is never the only cue: the label always names the state. */
@Composable
fun AlertStatusChip(state: AlertState, modifier: Modifier = Modifier) {
    val style = state.style()
    Row(
        modifier = modifier
            .background(style.color.copy(alpha = 0.14f), RoundedCornerShape(VsRadius.chip))
            .padding(horizontal = VsSpacing.sm, vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(VsSpacing.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(style.color, CircleShape),
        )
        Text(
            text = stringResource(style.labelRes),
            style = MaterialTheme.typography.labelMedium,
            color = style.color,
        )
    }
}
