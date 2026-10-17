package com.vozsegura.wear.presentation.ambient

import androidx.compose.runtime.compositionLocalOf

/** Display mode of the watch: fully lit, or always-on (ambient) with power and burn-in limits. */
sealed interface AmbientMode {
    data object Interactive : AmbientMode

    data class Ambient(
        /** OLED panels: content must shift every minute to avoid burning pixels in. */
        val burnInProtectionRequired: Boolean,
        /** Some panels only render a few colors in ambient; avoid greys and anti-aliasing. */
        val lowBitAmbient: Boolean,
    ) : AmbientMode
}

/** Current mode plus a counter the system bumps once a minute while in ambient. */
data class AmbientState(val mode: AmbientMode = AmbientMode.Interactive, val tick: Int = 0)

/**
 * Provided above the nav host: destination lambdas are captured once when the graph is
 * built, so passing ambient values as parameters would freeze them at their first value.
 */
val LocalAmbientState = compositionLocalOf { AmbientState() }
