package com.vozsegura.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import com.vozsegura.mobile.R
import com.vozsegura.mobile.ui.components.SectionTitle
import com.vozsegura.mobile.ui.components.VsButton
import com.vozsegura.mobile.ui.components.VsButtonVariant
import com.vozsegura.mobile.ui.components.VsCard
import com.vozsegura.mobile.ui.components.VsScreen
import com.vozsegura.mobile.ui.components.rememberConnectedWatch
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsRadius
import com.vozsegura.mobile.ui.theme.VsSpacing
import com.vozsegura.mobile.vozSegura

@Composable
fun SettingsScreen(onOpenDesignSystem: () -> Unit) {
    val repository = LocalContext.current.vozSegura.configRepository
    val config by repository.config.collectAsState()
    val watchName = rememberConnectedWatch()

    var message by rememberSaveable { mutableStateOf(config.alertMessage) }
    var justSaved by rememberSaveable { mutableStateOf(false) }
    val changed = message.trim() != config.alertMessage

    VsScreen(title = stringResource(R.string.settings_title)) {
        SectionTitle(stringResource(R.string.settings_message_title))
        VsCard(modifier = Modifier.fillMaxWidth()) {
            OutlinedTextField(
                value = message,
                onValueChange = {
                    message = it.take(MAX_MESSAGE_LENGTH)
                    justSaved = false
                },
                isError = message.isBlank(),
                supportingText = {
                    Text(
                        stringResource(
                            when {
                                message.isBlank() -> R.string.settings_message_empty
                                justSaved -> R.string.settings_saved
                                else -> R.string.settings_message_help
                            },
                        ),
                    )
                },
                minLines = 2,
                shape = RoundedCornerShape(VsRadius.field),
                modifier = Modifier.fillMaxWidth(),
            )
            Spacer(Modifier.height(VsSpacing.xs))
            VsButton(
                text = stringResource(R.string.action_save),
                enabled = changed && message.isNotBlank(),
                variant = VsButtonVariant.SECONDARY,
                onClick = {
                    repository.setAlertMessage(message)
                    justSaved = true
                },
            )
        }

        SectionTitle(stringResource(R.string.settings_demo_title))
        VsCard(modifier = Modifier.fillMaxWidth()) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(VsSpacing.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    stringResource(R.string.settings_demo_body),
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.weight(1f),
                )
                Switch(
                    checked = config.demoMode,
                    onCheckedChange = repository::setDemoMode,
                    colors = SwitchDefaults.colors(
                        checkedTrackColor = VsColors.Primary,
                        checkedThumbColor = VsColors.TextPrimary,
                    ),
                )
            }
        }

        SectionTitle(stringResource(R.string.settings_watch_title))
        VsCard(modifier = Modifier.fillMaxWidth()) {
            Text(
                watchName?.let { stringResource(R.string.home_watch_connected, it) }
                    ?: stringResource(R.string.home_watch_disconnected),
                style = MaterialTheme.typography.bodyMedium,
                color = if (watchName != null) VsColors.Success else VsColors.TextSecondary,
            )
        }

        SectionTitle(stringResource(R.string.settings_privacy_title))
        VsCard(modifier = Modifier.fillMaxWidth()) {
            Column {
                Text(stringResource(R.string.settings_privacy_body), style = MaterialTheme.typography.bodyMedium)
            }
        }

        VsButton(
            text = stringResource(R.string.settings_design_system),
            onClick = onOpenDesignSystem,
            variant = VsButtonVariant.SECONDARY,
        )
    }
}

private const val MAX_MESSAGE_LENGTH = 200
