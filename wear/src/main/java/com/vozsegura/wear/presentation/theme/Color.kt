package com.vozsegura.wear.presentation.theme

import androidx.compose.ui.graphics.Color
import androidx.wear.compose.material3.ColorScheme
import com.vozsegura.shared.design.VozSeguraPalette

/**
 * Stealth tokens: the watch face in EVERY alert state (idle, activated, sent, error, cancelled).
 * Pure black + neutral greys so the screen never reveals that an alert is running.
 */
object StealthColors {
    val Background = Color(VozSeguraPalette.STEALTH_BACKGROUND)
    val TextPrimary = Color(VozSeguraPalette.STEALTH_TEXT_PRIMARY)
    val TextSecondary = Color(VozSeguraPalette.STEALTH_TEXT_SECONDARY)
    val Track = Color(VozSeguraPalette.STEALTH_TRACK)
    val AmbientText = Color(VozSeguraPalette.STEALTH_AMBIENT_TEXT)
}

/** Brand tokens: watch setup screens only (permissions, first-run), never the watch face. */
object BrandColors {
    val Background = Color(VozSeguraPalette.BACKGROUND)
    val Surface = Color(VozSeguraPalette.SURFACE)
    val SurfaceElevated = Color(VozSeguraPalette.SURFACE_ELEVATED)
    val Primary = Color(VozSeguraPalette.PRIMARY)
    val PrimaryLight = Color(VozSeguraPalette.PRIMARY_LIGHT)
    val TextPrimary = Color(VozSeguraPalette.TEXT_PRIMARY)
    val TextSecondary = Color(VozSeguraPalette.TEXT_SECONDARY)
    val Outline = Color(VozSeguraPalette.OUTLINE)
    val Danger = Color(VozSeguraPalette.DANGER)
    val DangerStrong = Color(VozSeguraPalette.DANGER_STRONG)
}

internal val BrandColorScheme = ColorScheme(
    primary = BrandColors.Primary,
    primaryDim = BrandColors.Primary,
    primaryContainer = BrandColors.SurfaceElevated,
    onPrimary = Color.White,
    onPrimaryContainer = BrandColors.PrimaryLight,
    secondary = BrandColors.PrimaryLight,
    secondaryContainer = BrandColors.SurfaceElevated,
    onSecondary = BrandColors.Background,
    onSecondaryContainer = BrandColors.TextPrimary,
    surfaceContainerLow = BrandColors.Surface,
    surfaceContainer = BrandColors.Surface,
    surfaceContainerHigh = BrandColors.SurfaceElevated,
    onSurface = BrandColors.TextPrimary,
    onSurfaceVariant = BrandColors.TextSecondary,
    outline = BrandColors.Outline,
    outlineVariant = BrandColors.SurfaceElevated,
    background = BrandColors.Background,
    onBackground = BrandColors.TextPrimary,
    error = BrandColors.Danger,
    errorContainer = BrandColors.DangerStrong,
    onError = Color.White,
    onErrorContainer = Color.White,
)
