package com.vozsegura.mobile.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import com.vozsegura.shared.design.VozSeguraPalette

/** Phone color tokens, wrapped from the shared palette. */
object VsColors {
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
    val Success = Color(VozSeguraPalette.SUCCESS)
    val Warning = Color(VozSeguraPalette.WARNING)

    val RingGradient = listOf(
        Color(VozSeguraPalette.GRADIENT_START),
        Color(VozSeguraPalette.GRADIENT_END),
    )
    val ButtonGradient = Brush.horizontalGradient(
        listOf(
            Color(VozSeguraPalette.BUTTON_GRADIENT_START),
            Color(VozSeguraPalette.BUTTON_GRADIENT_END),
        ),
    )
}
