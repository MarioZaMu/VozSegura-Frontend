package com.vozsegura.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import com.vozsegura.mobile.R
import com.vozsegura.mobile.ui.components.AlertStatusChip
import com.vozsegura.mobile.ui.components.NumberedStep
import com.vozsegura.mobile.ui.components.ProgressRing
import com.vozsegura.mobile.ui.components.SectionTitle
import com.vozsegura.mobile.ui.components.StatValue
import com.vozsegura.mobile.ui.components.VsButton
import com.vozsegura.mobile.ui.components.VsButtonVariant
import com.vozsegura.mobile.ui.components.VsCard
import com.vozsegura.mobile.ui.components.VsScreen
import com.vozsegura.mobile.ui.components.rememberConnectedWatch
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsSize
import com.vozsegura.mobile.ui.theme.VsSpacing
import com.vozsegura.mobile.vozSegura

/** Contacts needed for the ring to fill: one is enough to work, three is the recommendation. */
private const val RECOMMENDED_CONTACTS = 3

@Composable
fun HomeScreen(
    onTestGesture: () -> Unit,
    onOpenContacts: () -> Unit,
    onOpenHistory: () -> Unit,
) {
    val app = LocalContext.current.vozSegura
    val config by app.configRepository.config.collectAsState()
    val history by app.historyRepository.entries.collectAsState()
    val watchName = rememberConnectedWatch()
    val contactCount = config.contacts.size

    VsScreen(
        title = stringResource(R.string.home_title),
        subtitle = stringResource(if (contactCount > 0) R.string.home_ready else R.string.home_not_ready),
    ) {
        VsCard(modifier = Modifier.fillMaxWidth()) {
            Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                ProgressRing(progress = contactCount.toFloat() / RECOMMENDED_CONTACTS) {
                    StatValue(
                        value = contactCount.toString(),
                        caption = stringResource(R.string.home_contacts_caption),
                    )
                }
            }
            Spacer(Modifier.height(VsSpacing.lg))
            StatusLine(
                icon = R.drawable.ic_watch,
                text = watchName?.let { stringResource(R.string.home_watch_connected, it) }
                    ?: stringResource(R.string.home_watch_disconnected),
                color = if (watchName != null) VsColors.Success else VsColors.TextSecondary,
            )
            if (config.demoMode) {
                Spacer(Modifier.height(VsSpacing.xs))
                StatusLine(R.drawable.ic_settings, stringResource(R.string.home_demo_on), VsColors.Warning)
            }
        }

        VsButton(
            text = stringResource(R.string.action_test_gesture),
            onClick = onTestGesture,
            leadingIcon = R.drawable.ic_touch,
        )
        if (contactCount == 0) {
            VsButton(
                text = stringResource(R.string.home_add_contacts),
                onClick = onOpenContacts,
                variant = VsButtonVariant.SECONDARY,
                leadingIcon = R.drawable.ic_add,
            )
        }

        history.firstOrNull()?.let { last ->
            SectionTitle(stringResource(R.string.home_last_alert))
            VsCard(modifier = Modifier.fillMaxWidth(), onClick = onOpenHistory) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(VsSpacing.sm),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    AlertStatusChip(last.state)
                    Text(
                        text = formatAlertTime(last.createdAtEpochMs),
                        style = MaterialTheme.typography.bodyMedium,
                        color = VsColors.TextSecondary,
                        modifier = Modifier.weight(1f),
                    )
                    Icon(painterResource(R.drawable.ic_chevron_right), contentDescription = null)
                }
            }
        }

        SectionTitle(stringResource(R.string.home_how_title))
        VsCard(modifier = Modifier.fillMaxWidth()) {
            listOf(
                R.string.home_how_step1,
                R.string.home_how_step2,
                R.string.home_how_step3,
                R.string.home_how_step4,
            ).forEachIndexed { index, step ->
                if (index > 0) Spacer(Modifier.height(VsSpacing.sm))
                NumberedStep(index + 1, stringResource(step))
            }
        }
    }
}

@Composable
private fun StatusLine(icon: Int, text: String, color: Color) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(VsSpacing.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Icon(painterResource(icon), contentDescription = null, tint = color, modifier = Modifier.size(VsSize.icon))
        Text(text, style = MaterialTheme.typography.bodyMedium, color = color)
    }
}
