package com.vozsegura.mobile.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import com.vozsegura.mobile.ui.theme.VsColors

/** Large bold number with a small caption underneath ("850 / cal" in the reference). */
@Composable
fun StatValue(
    value: String,
    caption: String,
    modifier: Modifier = Modifier,
    valueStyle: TextStyle = MaterialTheme.typography.displaySmall,
) {
    Column(modifier = modifier.semantics(mergeDescendants = true) {}, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, style = valueStyle, color = VsColors.TextPrimary)
        Text(
            text = caption,
            style = MaterialTheme.typography.bodySmall,
            color = VsColors.TextSecondary,
        )
    }
}
