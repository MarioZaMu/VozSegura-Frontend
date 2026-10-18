package com.vozsegura.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
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
import androidx.compose.ui.semantics.semantics
import com.vozsegura.mobile.R
import com.vozsegura.mobile.data.HistoryEntry
import com.vozsegura.mobile.ui.components.AlertStatusChip
import com.vozsegura.mobile.ui.components.VsButton
import com.vozsegura.mobile.ui.components.VsButtonVariant
import com.vozsegura.mobile.ui.components.VsCard
import com.vozsegura.mobile.ui.components.VsScreen
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsSpacing
import com.vozsegura.mobile.vozSegura
import com.vozsegura.shared.model.AlertState
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun HistoryScreen() {
    val repository = LocalContext.current.vozSegura.historyRepository
    val entries by repository.entries.collectAsState()
    var confirmClear by rememberSaveable { mutableStateOf(false) }

    VsScreen(
        title = stringResource(R.string.history_title),
        subtitle = stringResource(R.string.history_subtitle),
    ) {
        if (entries.isEmpty()) {
            Text(stringResource(R.string.history_empty), style = MaterialTheme.typography.bodyMedium)
        }
        entries.forEach { HistoryRow(it) }
        if (entries.isNotEmpty()) {
            VsButton(
                text = stringResource(R.string.history_clear),
                onClick = { confirmClear = true },
                variant = VsButtonVariant.SECONDARY,
                leadingIcon = R.drawable.ic_delete,
            )
        }
    }

    if (confirmClear) {
        AlertDialog(
            onDismissRequest = { confirmClear = false },
            title = { Text(stringResource(R.string.history_clear_title)) },
            text = { Text(stringResource(R.string.history_clear_body)) },
            confirmButton = {
                TextButton(onClick = {
                    repository.clear()
                    confirmClear = false
                }) { Text(stringResource(R.string.action_clear), color = VsColors.Danger) }
            },
            dismissButton = {
                TextButton(onClick = { confirmClear = false }) { Text(stringResource(R.string.action_cancel)) }
            },
            containerColor = VsColors.SurfaceElevated,
        )
    }
}

@Composable
private fun HistoryRow(entry: HistoryEntry) {
    VsCard(modifier = Modifier
        .fillMaxWidth()
        .semantics(mergeDescendants = true) {}) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            AlertStatusChip(entry.state)
            Text(
                formatAlertTime(entry.createdAtEpochMs),
                style = MaterialTheme.typography.bodySmall,
                color = VsColors.TextSecondary,
            )
        }
        Spacer(Modifier.height(VsSpacing.sm))
        Text(stringResource(entry.description()), style = MaterialTheme.typography.bodyMedium)
    }
}

/** Explains what the contacts actually received, which is what the user needs to know afterwards. */
private fun HistoryEntry.description(): Int = when (state) {
    AlertState.SENT -> R.string.history_sent
    AlertState.ACTIVATED, AlertState.IDLE -> R.string.history_sending
    AlertState.ERROR -> R.string.history_error
    AlertState.CANCELLED ->
        if (contactsNotified) R.string.history_cancelled_notified else R.string.history_cancelled_silent
}

private val alertTimeFormat = DateTimeFormatter.ofPattern("d MMM yyyy · HH:mm", Locale.forLanguageTag("es"))

internal fun formatAlertTime(epochMs: Long): String =
    alertTimeFormat.format(Instant.ofEpochMilli(epochMs).atZone(ZoneId.systemDefault()))
