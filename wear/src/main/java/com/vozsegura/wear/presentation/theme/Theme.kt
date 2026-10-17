package com.vozsegura.wear.presentation.theme

import androidx.compose.runtime.Composable
import androidx.wear.compose.material3.MaterialTheme

/**
 * Brand theme for watch setup screens. The watch face does not depend on it: it reads
 * [StealthColors] and [WatchFaceType] directly so a theme change can never leak magenta into it.
 */
@Composable
fun VozSeguraTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = BrandColorScheme,
        typography = BrandTypography,
        content = content,
    )
}
