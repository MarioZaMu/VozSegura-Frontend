package com.vozsegura.mobile.ui.screens

import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.vozsegura.mobile.R
import com.vozsegura.mobile.ui.components.AlertStatusChip
import com.vozsegura.mobile.ui.components.ProgressRing
import com.vozsegura.mobile.ui.components.StatValue
import com.vozsegura.mobile.ui.components.VsButton
import com.vozsegura.mobile.ui.components.VsButtonVariant
import com.vozsegura.mobile.ui.components.VsCard
import com.vozsegura.mobile.ui.components.VsIconButton
import com.vozsegura.mobile.ui.theme.VozSeguraTheme
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsRadius
import com.vozsegura.mobile.ui.theme.VsSpacing
import com.vozsegura.shared.model.AlertState

/** Showcase of the design system (phase 2), kept for the case presentation; opened from Settings. */
@Composable
fun DesignCatalogScreen(onBack: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(VsColors.Background)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = VsSpacing.screen, vertical = VsSpacing.xl),
        verticalArrangement = Arrangement.spacedBy(VsSpacing.md),
    ) {
        VsIconButton(R.drawable.ic_back, stringResource(R.string.cd_back), onClick = onBack)
        Text(stringResource(R.string.catalog_title), style = MaterialTheme.typography.headlineLarge)
        Text(
            stringResource(R.string.catalog_subtitle),
            style = MaterialTheme.typography.bodyMedium,
            color = VsColors.TextSecondary,
        )

        VsCard(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                ProgressRing(progress = 0.75f) {
                    StatValue(
                        value = stringResource(R.string.catalog_ring_value),
                        caption = stringResource(R.string.catalog_ring_caption),
                    )
                }
            }
            Spacer(Modifier.height(VsSpacing.lg))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(VsSpacing.md, Alignment.CenterHorizontally),
            ) {
                VsIconButton(R.drawable.ic_mic, stringResource(R.string.cd_microphone), onClick = {})
                VsIconButton(
                    icon = R.drawable.ic_close,
                    contentDescription = stringResource(R.string.cd_cancel),
                    onClick = {},
                    size = 56.dp,
                    containerColor = VsColors.DangerStrong,
                )
                VsIconButton(R.drawable.ic_location, stringResource(R.string.cd_location), onClick = {})
            }
        }

        SectionLabel(stringResource(R.string.catalog_states))
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(VsSpacing.xs),
            verticalArrangement = Arrangement.spacedBy(VsSpacing.xs),
        ) {
            AlertState.entries.forEach { AlertStatusChip(it) }
        }

        SectionLabel(stringResource(R.string.catalog_buttons))
        VsButton(stringResource(R.string.action_test_gesture), onClick = {})
        VsButton(
            stringResource(R.string.action_edit_message),
            onClick = {},
            variant = VsButtonVariant.SECONDARY,
        )
        VsButton(
            stringResource(R.string.action_cancel_alert),
            onClick = {},
            variant = VsButtonVariant.DANGER,
            leadingIcon = R.drawable.ic_close,
        )

        SectionLabel(stringResource(R.string.catalog_colors))
        FlowRow(
            horizontalArrangement = Arrangement.spacedBy(VsSpacing.xs),
            verticalArrangement = Arrangement.spacedBy(VsSpacing.xs),
        ) {
            listOf(
                VsColors.Background, VsColors.Surface, VsColors.SurfaceElevated, VsColors.Primary,
                VsColors.PrimaryLight, VsColors.TextSecondary, VsColors.Danger, VsColors.Success,
            ).forEach { Swatch(it) }
        }

        SectionLabel(stringResource(R.string.catalog_type))
        VsCard(modifier = Modifier.fillMaxWidth()) {
            val type = MaterialTheme.typography
            Text("850", style = type.displayLarge)
            Text("Título de pantalla", style = type.headlineMedium)
            Text("Título de tarjeta", style = type.titleMedium)
            Text("Texto de cuerpo para descripciones.", style = type.bodyMedium)
            Text("ETIQUETA", style = type.labelSmall, color = VsColors.TextSecondary)
        }
    }
}

@Composable
private fun SectionLabel(text: String) {
    Text(
        text = text,
        style = MaterialTheme.typography.titleMedium,
        modifier = Modifier.padding(top = VsSpacing.xs),
    )
}

@Composable
private fun Swatch(color: Color) {
    Box(
        modifier = Modifier
            .size(48.dp)
            .background(color, RoundedCornerShape(VsRadius.chip))
            .border(1.dp, VsColors.Outline, RoundedCornerShape(VsRadius.chip)),
    )
}

@Preview(showBackground = true, backgroundColor = 0xFF0B0613, heightDp = 1400)
@Composable
private fun DesignCatalogPreview() {
    VozSeguraTheme { DesignCatalogScreen(onBack = {}) }
}
