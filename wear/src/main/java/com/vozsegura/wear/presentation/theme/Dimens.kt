package com.vozsegura.wear.presentation.theme

import androidx.compose.ui.unit.dp

object WatchDimens {
    /** Minimum touch target on Wear OS. */
    val minTouch = 48.dp
    /**
     * Fraction of the screen diameter kept as margin on round screens so text never touches
     * the curved edge (content fits the inscribed square: (1 - 1/sqrt(2)) / 2 is about 14.6%).
     */
    const val ROUND_EDGE_FRACTION = 0.146f
    /** Square screens only need a flat 8dp gutter. */
    val squareGutter = 8.dp
}
