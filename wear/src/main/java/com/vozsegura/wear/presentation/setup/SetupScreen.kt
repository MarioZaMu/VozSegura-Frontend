package com.vozsegura.wear.presentation.setup

import android.content.Context
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.core.content.edit
import androidx.wear.compose.foundation.lazy.TransformingLazyColumn
import androidx.wear.compose.foundation.lazy.rememberTransformingLazyColumnState
import androidx.wear.compose.material3.EdgeButton
import androidx.wear.compose.material3.Icon
import androidx.wear.compose.material3.ListHeader
import androidx.wear.compose.material3.MaterialTheme
import androidx.wear.compose.material3.ScreenScaffold
import androidx.wear.compose.material3.Text
import androidx.wear.compose.ui.tooling.preview.WearPreviewDevices
import com.vozsegura.wear.R
import com.vozsegura.wear.alert.AlertPermissions
import com.vozsegura.wear.presentation.theme.BrandColors
import com.vozsegura.wear.presentation.theme.VozSeguraTheme

/** Remembers that first-run setup was shown, so the watch face is the only screen afterwards. */
object SetupPrefs {
    private const val FILE = "setup"
    private const val KEY_DONE = "done"

    fun isDone(context: Context) =
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE).getBoolean(KEY_DONE, false)

    fun markDone(context: Context) =
        context.getSharedPreferences(FILE, Context.MODE_PRIVATE).edit { putBoolean(KEY_DONE, true) }
}

private data class PermissionRow(
    @param:DrawableRes val icon: Int,
    @param:StringRes val title: Int,
    @param:StringRes val body: Int,
)

private val rows = listOf(
    PermissionRow(R.drawable.ic_mic, R.string.setup_mic_title, R.string.setup_mic_body),
    PermissionRow(R.drawable.ic_location, R.string.setup_location_title, R.string.setup_location_body),
    PermissionRow(R.drawable.ic_notifications, R.string.setup_notifications_title, R.string.setup_notifications_body),
)

/**
 * First-run permission request (brand theme). Asked here, once and in private, never at the
 * moment of an emergency. Whatever the user grants, setup ends: missing permissions only
 * remove detail (audio, location) from the alert, they never disable it.
 */
@Composable
fun SetupScreen(onDone: () -> Unit) {
    val currentOnDone by rememberUpdatedState(onDone)
    val launcher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions(),
    ) { currentOnDone() }

    // Keep centered text clear of the curved edge on round screens; square ones need little.
    val configuration = LocalConfiguration.current
    val gutter = configuration.screenWidthDp.dp * if (configuration.isScreenRound) 0.09f else 0.04f

    val listState = rememberTransformingLazyColumnState()
    ScreenScaffold(
        scrollState = listState,
        edgeButton = {
            EdgeButton(onClick = { launcher.launch(AlertPermissions.requested) }) {
                Text(stringResource(R.string.setup_allow))
            }
        },
    ) { contentPadding ->
        TransformingLazyColumn(contentPadding = contentPadding, state = listState) {
            item {
                ListHeader { Text(stringResource(R.string.setup_title), textAlign = TextAlign.Center) }
            }
            item {
                Text(
                    text = stringResource(R.string.setup_body),
                    style = MaterialTheme.typography.bodySmall,
                    color = BrandColors.TextSecondary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = gutter, vertical = 4.dp),
                )
            }
            rows.forEach { row -> item { PermissionItem(row, gutter) } }
        }
    }
}

/** Stacked and centered: on a round screen a left-aligned icon ends up under the curved edge. */
@Composable
private fun PermissionItem(row: PermissionRow, gutter: Dp) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = gutter, vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        Icon(
            painter = painterResource(row.icon),
            contentDescription = null,
            tint = BrandColors.PrimaryLight,
            modifier = Modifier.size(24.dp),
        )
        Text(stringResource(row.title), style = MaterialTheme.typography.titleSmall)
        Text(
            text = stringResource(row.body),
            style = MaterialTheme.typography.bodySmall,
            color = BrandColors.TextSecondary,
            textAlign = TextAlign.Center,
        )
    }
}

@WearPreviewDevices
@Composable
private fun SetupScreenPreview() {
    VozSeguraTheme { SetupScreen(onDone = {}) }
}
