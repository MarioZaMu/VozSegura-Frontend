package com.vozsegura.shared.design

/**
 * Raw color tokens (ARGB) shared by the watch and phone apps.
 * Kept free of Compose so each app wraps them in its own theme: `Color(VozSeguraPalette.BACKGROUND)`.
 */
object VozSeguraPalette {
    // Brand palette: phone app and watch setup screens only.
    const val BACKGROUND = 0xFF0B0613
    const val SURFACE = 0xFF1A1225
    const val SURFACE_ELEVATED = 0xFF2A2236
    const val PRIMARY = 0xFFC026D3
    /** Lighter magenta for accent text/icons on dark (5.7:1 on BACKGROUND; PRIMARY is only 4.1:1). */
    const val PRIMARY_LIGHT = 0xFFD946EF
    /** Decorative gradient (progress rings). Never put text on it: white on D946EF is 3.5:1. */
    const val GRADIENT_START = 0xFFD946EF
    const val GRADIENT_END = 0xFF8B5CF6
    /** Filled-button gradient: white label stays at or above 4.7:1 across the whole sweep. */
    const val BUTTON_GRADIENT_START = 0xFFC026D3
    const val BUTTON_GRADIENT_END = 0xFF7C3AED
    const val TEXT_PRIMARY = 0xFFFFFFFF
    const val TEXT_SECONDARY = 0xFF9A93A8
    const val OUTLINE = 0xFF3A3146

    /** Danger accent for icons/text on dark (4.7:1 on BACKGROUND). */
    const val DANGER = 0xFFE53935
    /** Filled danger buttons: white label reaches 5.6:1 (DANGER only gives 4.2:1). */
    const val DANGER_STRONG = 0xFFC62828
    const val SUCCESS = 0xFF34D399
    const val WARNING = 0xFFFBBF24

    // Stealth palette: watch face in every alert state. Neutral greys only, nothing that hints a feature.
    const val STEALTH_BACKGROUND = 0xFF000000
    const val STEALTH_TEXT_PRIMARY = 0xFFFFFFFF
    /** Neutral grey (7.7:1 on black), deliberately not the violet-tinted TEXT_SECONDARY. */
    const val STEALTH_TEXT_SECONDARY = 0xFF9E9E9E
    const val STEALTH_TRACK = 0xFF262626
    /** Dimmed time for ambient (always-on) mode. */
    const val STEALTH_AMBIENT_TEXT = 0xFFBDBDBD
}
