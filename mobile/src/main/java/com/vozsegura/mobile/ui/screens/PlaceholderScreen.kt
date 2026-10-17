package com.vozsegura.mobile.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.vozsegura.mobile.R

/** Temporary screen body used until each tab is built in its own phase. */
@Composable
internal fun PlaceholderScreen(title: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Text(text = title, style = MaterialTheme.typography.headlineMedium)
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/** Phase 2: shows the design catalog so the system can be checked on a real device. */
@Composable
fun HomeScreen() = DesignCatalogScreen()

@Composable
fun ContactsScreen() = PlaceholderScreen(
    title = stringResource(R.string.contacts_title),
    subtitle = stringResource(R.string.placeholder_coming_soon),
)

@Composable
fun HistoryScreen() = PlaceholderScreen(
    title = stringResource(R.string.history_title),
    subtitle = stringResource(R.string.placeholder_coming_soon),
)

@Composable
fun SettingsScreen() = PlaceholderScreen(
    title = stringResource(R.string.settings_title),
    subtitle = stringResource(R.string.placeholder_coming_soon),
)
