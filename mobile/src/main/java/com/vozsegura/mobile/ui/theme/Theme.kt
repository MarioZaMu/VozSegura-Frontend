package com.vozsegura.mobile.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/** The app is always dark: no light theme and no dynamic color, so the brand stays consistent. */
private val VsColorScheme = darkColorScheme(
    primary = VsColors.Primary,
    onPrimary = Color.White,
    primaryContainer = VsColors.SurfaceElevated,
    onPrimaryContainer = VsColors.PrimaryLight,
    secondary = VsColors.PrimaryLight,
    onSecondary = VsColors.Background,
    tertiary = Color(0xFF8B5CF6),
    background = VsColors.Background,
    onBackground = VsColors.TextPrimary,
    surface = VsColors.Background,
    onSurface = VsColors.TextPrimary,
    surfaceVariant = VsColors.Surface,
    onSurfaceVariant = VsColors.TextSecondary,
    surfaceContainerLowest = VsColors.Background,
    surfaceContainerLow = VsColors.Surface,
    surfaceContainer = VsColors.Surface,
    surfaceContainerHigh = VsColors.SurfaceElevated,
    surfaceContainerHighest = VsColors.SurfaceElevated,
    outline = VsColors.Outline,
    outlineVariant = VsColors.SurfaceElevated,
    error = VsColors.Danger,
    onError = Color.White,
)

@Composable
fun VozSeguraTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = VsColorScheme,
        typography = VsTypography,
        content = content,
    )
}
