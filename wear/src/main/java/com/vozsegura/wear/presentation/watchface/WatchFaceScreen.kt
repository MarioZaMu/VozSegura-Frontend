package com.vozsegura.wear.presentation.watchface

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.wear.compose.material3.Text
import androidx.wear.compose.ui.tooling.preview.WearPreviewDevices
import com.vozsegura.wear.presentation.theme.StealthColors
import com.vozsegura.wear.presentation.theme.WatchFaceType
import kotlinx.coroutines.delay
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

private val spanish: Locale = Locale.forLanguageTag("es")
private val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm", spanish)
private val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("EEE d 'de' MMM", spanish)

/**
 * Phase 1 placeholder: a plain digital watch face (time + date).
 * Final styling and the hidden double-tap trigger arrive in phases 3 and 4.
 */
@Composable
fun WatchFaceScreen() {
    var now by remember { mutableStateOf(LocalDateTime.now()) }
    LaunchedEffect(Unit) {
        while (true) {
            now = LocalDateTime.now()
            delay(1_000)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(StealthColors.Background),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(
            text = now.format(timeFormatter),
            style = WatchFaceType.Time,
            color = StealthColors.TextPrimary,
        )
        Text(
            text = now.format(dateFormatter),
            style = WatchFaceType.Date,
            color = StealthColors.TextSecondary,
        )
    }
}

@WearPreviewDevices
@Composable
private fun WatchFaceScreenPreview() {
    WatchFaceScreen()
}
