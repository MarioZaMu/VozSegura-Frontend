package com.vozsegura.mobile.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.vozsegura.mobile.R
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsSpacing
import com.vozsegura.mobile.vozSegura
import kotlinx.coroutines.delay

/** Scrolling screen body with the standard title + subtitle header and an optional back button. */
@Composable
fun VsScreen(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    onBack: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(VsColors.Background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = VsSpacing.screen, vertical = VsSpacing.xl),
        verticalArrangement = Arrangement.spacedBy(VsSpacing.md),
    ) {
        if (onBack != null) {
            VsIconButton(R.drawable.ic_back, stringResource(R.string.cd_back), onClick = onBack)
        }
        Text(title, style = MaterialTheme.typography.headlineLarge)
        if (subtitle != null) {
            Text(subtitle, style = MaterialTheme.typography.bodyMedium, color = VsColors.TextSecondary)
        }
        content()
    }
}

@Composable
fun SectionTitle(text: String, modifier: Modifier = Modifier) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleMedium,
        modifier = modifier.padding(top = VsSpacing.xs),
    )
}

/** Numbered instruction row: the number is text, so the order is clear without the color. */
@Composable
fun NumberedStep(number: Int, text: String, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(VsSpacing.sm),
        verticalAlignment = Alignment.Top,
    ) {
        Box(
            modifier = Modifier
                .size(28.dp)
                .background(VsColors.SurfaceElevated, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Text(number.toString(), style = MaterialTheme.typography.labelLarge, color = VsColors.PrimaryLight)
        }
        Text(text, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.weight(1f))
    }
}

/** Connected watch name, refreshed every few seconds; null while none is connected. */
@Composable
fun rememberConnectedWatch(): String? {
    val watchSync = LocalContext.current.vozSegura.watchSync
    var name by remember { mutableStateOf<String?>(null) }
    LaunchedEffect(watchSync) {
        while (true) {
            name = watchSync.connectedWatchName()
            delay(WATCH_POLL_MS)
        }
    }
    return name
}

private const val WATCH_POLL_MS = 5_000L
