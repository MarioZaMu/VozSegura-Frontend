package com.vozsegura.mobile.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsRadius
import com.vozsegura.mobile.ui.theme.VsSpacing

/** Rounded surface card (28dp corners) used for every grouped block on the phone. */
@Composable
fun VsCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    color: Color = VsColors.Surface,
    contentPadding: PaddingValues = PaddingValues(VsSpacing.lg),
    content: @Composable ColumnScope.() -> Unit,
) {
    val shape = RoundedCornerShape(VsRadius.card)
    val body: @Composable () -> Unit = {
        Column(modifier = Modifier.padding(contentPadding), content = content)
    }
    if (onClick != null) {
        Surface(onClick = onClick, modifier = modifier, shape = shape, color = color, content = body)
    } else {
        Surface(modifier = modifier, shape = shape, color = color, content = body)
    }
}
