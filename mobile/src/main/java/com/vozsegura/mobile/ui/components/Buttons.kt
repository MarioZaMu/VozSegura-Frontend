package com.vozsegura.mobile.ui.components

import androidx.annotation.DrawableRes
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsSize
import com.vozsegura.mobile.ui.theme.VsSpacing

enum class VsButtonVariant { PRIMARY, SECONDARY, DANGER }

/** Full-width pill button, 56dp tall. PRIMARY uses the magenta-violet gradient. */
@Composable
fun VsButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: VsButtonVariant = VsButtonVariant.PRIMARY,
    enabled: Boolean = true,
    @DrawableRes leadingIcon: Int? = null,
) {
    val fill: Brush = when (variant) {
        VsButtonVariant.PRIMARY -> VsColors.ButtonGradient
        VsButtonVariant.SECONDARY -> SolidColor(VsColors.SurfaceElevated)
        VsButtonVariant.DANGER -> SolidColor(VsColors.DangerStrong)
    }
    Surface(
        onClick = onClick,
        enabled = enabled,
        shape = CircleShape,
        color = Color.Transparent,
        contentColor = Color.White,
        modifier = modifier
            .fillMaxWidth()
            .height(VsSize.buttonHeight)
            .alpha(if (enabled) 1f else 0.4f),
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .background(fill, CircleShape)
                .padding(horizontal = VsSpacing.xl),
            horizontalArrangement = Arrangement.spacedBy(VsSpacing.xs, Alignment.CenterHorizontally),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (leadingIcon != null) {
                Icon(
                    painter = painterResource(leadingIcon),
                    contentDescription = null,
                    modifier = Modifier.size(20.dp),
                )
            }
            Text(text = text, style = MaterialTheme.typography.labelLarge)
        }
    }
}

/** Round icon button (like the mic / keypad buttons in the reference). Always at least 48dp. */
@Composable
fun VsIconButton(
    @DrawableRes icon: Int,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    size: Dp = VsSize.iconButton,
    containerColor: Color = VsColors.SurfaceElevated,
    contentColor: Color = VsColors.TextPrimary,
) {
    Surface(
        onClick = onClick,
        shape = CircleShape,
        color = containerColor,
        contentColor = contentColor,
        modifier = modifier.size(maxOf(size, VsSize.minTouch)),
    ) {
        Box(contentAlignment = Alignment.Center) {
            Icon(
                painter = painterResource(icon),
                contentDescription = contentDescription,
                modifier = Modifier.size(VsSize.icon),
            )
        }
    }
}
