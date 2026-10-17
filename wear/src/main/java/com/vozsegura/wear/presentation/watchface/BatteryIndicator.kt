package com.vozsegura.wear.presentation.watchface

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.dp
import androidx.wear.compose.material3.Text

/**
 * Small line-style battery glyph + percentage. A familiar complication that makes the
 * screen read as an ordinary watch face. Stays neutral grey even when low.
 */
@Composable
fun BatteryIndicator(
    percent: Int,
    color: Color,
    textStyle: TextStyle,
    modifier: Modifier = Modifier,
) {
    if (percent < 0) return
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Canvas(modifier = Modifier.size(width = 16.dp, height = 9.dp)) {
            val stroke = 1.2.dp.toPx()
            val nubWidth = 1.5.dp.toPx()
            val bodyWidth = size.width - nubWidth
            val corner = CornerRadius(2.dp.toPx())
            drawRoundRect(
                color = color,
                topLeft = Offset(stroke / 2, stroke / 2),
                size = Size(bodyWidth - stroke, size.height - stroke),
                cornerRadius = corner,
                style = Stroke(stroke),
            )
            val inner = stroke * 2
            drawRoundRect(
                color = color,
                topLeft = Offset(inner, inner),
                size = Size((bodyWidth - inner * 2) * percent / 100f, size.height - inner * 2),
                cornerRadius = CornerRadius(1.dp.toPx()),
            )
            drawRect(
                color = color,
                topLeft = Offset(bodyWidth, size.height * 0.3f),
                size = Size(nubWidth, size.height * 0.4f),
            )
        }
        Text(text = "$percent%", style = textStyle, color = color)
    }
}
