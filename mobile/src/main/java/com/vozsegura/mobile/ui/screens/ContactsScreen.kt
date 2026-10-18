package com.vozsegura.mobile.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
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
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.vozsegura.mobile.BuildConfig
import com.vozsegura.mobile.R
import com.vozsegura.mobile.data.ConfigRepository
import com.vozsegura.mobile.ui.components.NumberedStep
import com.vozsegura.mobile.ui.components.SectionTitle
import com.vozsegura.mobile.ui.components.VsButton
import com.vozsegura.mobile.ui.components.VsButtonVariant
import com.vozsegura.mobile.ui.components.VsCard
import com.vozsegura.mobile.ui.components.VsIconButton
import com.vozsegura.mobile.ui.components.VsScreen
import com.vozsegura.mobile.ui.theme.VsColors
import com.vozsegura.mobile.ui.theme.VsRadius
import com.vozsegura.mobile.ui.theme.VsSpacing
import com.vozsegura.mobile.vozSegura
import com.vozsegura.shared.model.TrustedContact

@Composable
fun ContactsScreen() {
    val repository = LocalContext.current.vozSegura.configRepository
    val config by repository.config.collectAsState()
    var pendingRemoval by rememberSaveable { mutableStateOf<String?>(null) }

    VsScreen(
        title = stringResource(R.string.contacts_title),
        subtitle = stringResource(R.string.contacts_subtitle),
    ) {
        InviteCard()
        AddContactCard(
            existingChatIds = config.contacts.map { it.telegramChatId }.toSet(),
            onAdd = repository::addContact,
        )

        SectionTitle(stringResource(R.string.contacts_list_title))
        if (config.contacts.isEmpty()) {
            Text(
                stringResource(R.string.contacts_empty),
                style = MaterialTheme.typography.bodyMedium,
                color = VsColors.Warning,
            )
        }
        config.contacts.forEach { contact ->
            ContactRow(contact, onRemove = { pendingRemoval = contact.id })
        }
    }

    // Removing a safety contact is confirmed: a slip here could leave the user unprotected.
    config.contacts.firstOrNull { it.id == pendingRemoval }?.let { contact ->
        AlertDialog(
            onDismissRequest = { pendingRemoval = null },
            title = { Text(stringResource(R.string.contacts_remove_title, contact.name)) },
            text = { Text(stringResource(R.string.contacts_remove_body)) },
            confirmButton = {
                TextButton(onClick = {
                    repository.removeContact(contact.id)
                    pendingRemoval = null
                }) { Text(stringResource(R.string.action_remove), color = VsColors.Danger) }
            },
            dismissButton = {
                TextButton(onClick = { pendingRemoval = null }) { Text(stringResource(R.string.action_cancel)) }
            },
            containerColor = VsColors.SurfaceElevated,
        )
    }
}

@Composable
private fun InviteCard() {
    val context = LocalContext.current
    val botUsername = BuildConfig.BOT_USERNAME.removePrefix("@")
    val inviteText = stringResource(R.string.contacts_invite_text, "https://t.me/$botUsername")
    val chooserTitle = stringResource(R.string.contacts_invite_chooser)

    VsCard(modifier = Modifier.fillMaxWidth()) {
        Text(stringResource(R.string.contacts_how_title), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(VsSpacing.sm))
        listOf(R.string.contacts_how_step1, R.string.contacts_how_step2, R.string.contacts_how_step3)
            .forEachIndexed { index, step ->
                if (index > 0) Spacer(Modifier.height(VsSpacing.xs))
                NumberedStep(index + 1, stringResource(step))
            }
        Spacer(Modifier.height(VsSpacing.md))
        if (botUsername.isNotBlank()) {
            VsButton(
                text = stringResource(R.string.contacts_invite),
                leadingIcon = R.drawable.ic_share,
                onClick = {
                    val send = Intent(Intent.ACTION_SEND)
                        .setType("text/plain")
                        .putExtra(Intent.EXTRA_TEXT, inviteText)
                    context.startActivity(Intent.createChooser(send, chooserTitle))
                },
            )
        } else {
            Text(
                stringResource(R.string.contacts_invite_missing),
                style = MaterialTheme.typography.bodySmall,
                color = VsColors.TextSecondary,
            )
        }
    }
}

@Composable
private fun AddContactCard(existingChatIds: Set<String>, onAdd: (String, String) -> Unit) {
    var name by rememberSaveable { mutableStateOf("") }
    var code by rememberSaveable { mutableStateOf("") }
    // Errors show only after the first attempt, not while the user is still typing.
    var attempted by rememberSaveable { mutableStateOf(false) }

    val codeError = when {
        !ConfigRepository.isValidChatId(code) -> R.string.contacts_code_invalid
        code.trim() in existingChatIds -> R.string.contacts_code_duplicate
        else -> null
    }
    val fieldShape = RoundedCornerShape(VsRadius.field)

    VsCard(modifier = Modifier.fillMaxWidth()) {
        Text(stringResource(R.string.contacts_add_title), style = MaterialTheme.typography.titleMedium)
        Spacer(Modifier.height(VsSpacing.sm))
        OutlinedTextField(
            value = name,
            onValueChange = { name = it.take(MAX_NAME_LENGTH) },
            label = { Text(stringResource(R.string.contacts_name)) },
            singleLine = true,
            isError = attempted && name.isBlank(),
            shape = fieldShape,
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Words,
                imeAction = ImeAction.Next,
            ),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(VsSpacing.xs))
        OutlinedTextField(
            value = code,
            onValueChange = { value -> code = value.filter { it.isDigit() || it == '-' }.take(MAX_CODE_LENGTH) },
            label = { Text(stringResource(R.string.contacts_code)) },
            singleLine = true,
            isError = attempted && codeError != null,
            supportingText = {
                Text(stringResource(if (attempted && codeError != null) codeError else R.string.contacts_code_help))
            },
            shape = fieldShape,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done),
            modifier = Modifier.fillMaxWidth(),
        )
        Spacer(Modifier.height(VsSpacing.sm))
        VsButton(
            text = stringResource(R.string.contacts_add),
            leadingIcon = R.drawable.ic_add,
            variant = VsButtonVariant.SECONDARY,
            onClick = {
                attempted = true
                if (name.isNotBlank() && codeError == null) {
                    onAdd(name, code)
                    name = ""
                    code = ""
                    attempted = false
                }
            },
        )
    }
}

@Composable
private fun ContactRow(contact: TrustedContact, onRemove: () -> Unit) {
    VsCard(
        modifier = Modifier.fillMaxWidth(),
        contentPadding = PaddingValues(horizontal = VsSpacing.md, vertical = VsSpacing.sm),
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(VsSpacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .background(VsColors.ButtonGradient, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    contact.name.firstOrNull()?.uppercase() ?: "?",
                    style = MaterialTheme.typography.titleMedium,
                )
            }
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    contact.name,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Text(
                    stringResource(R.string.contacts_code_label, contact.telegramChatId),
                    style = MaterialTheme.typography.bodySmall,
                    color = VsColors.TextSecondary,
                )
            }
            VsIconButton(
                icon = R.drawable.ic_delete,
                contentDescription = stringResource(R.string.contacts_remove, contact.name),
                onClick = onRemove,
                containerColor = VsColors.Background,
                contentColor = VsColors.Danger,
            )
        }
    }
}

private const val MAX_NAME_LENGTH = 40
private const val MAX_CODE_LENGTH = 21
