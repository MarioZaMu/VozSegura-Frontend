package com.vozsegura.wear.presentation.theme

import androidx.compose.ui.unit.dp

object WatchDimens {
    /** Minimum touch target on Wear OS. */
    val minTouch = 48.dp
    /** Screen width the watch face type and spacing are designed at. */
    val referenceScreen = 200.dp
    /**
     * Fraction of the screen diameter kept as margin on round screens so text never touches
     * the curved edge (content fits the inscribed square: (1 - 1/sqrt(2)) / 2 is about 14.6%).
     */
    const val ROUND_EDGE_FRACTION = 0.146f
    /** Square screens only need a flat 8dp gutter. */
    val squareGutter = 8.dp
    /** Max burn-in shift in ambient mode, as a fraction of the screen width (~6dp on 200dp). */
    const val BURN_IN_SHIFT_FRACTION = 0.03f
}
