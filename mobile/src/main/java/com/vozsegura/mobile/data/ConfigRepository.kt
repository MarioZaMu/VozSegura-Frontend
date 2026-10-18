package com.vozsegura.mobile.data

import android.content.Context
import androidx.core.content.edit
import com.vozsegura.shared.datalayer.SyncJson
import com.vozsegura.shared.model.AlertConfig
import com.vozsegura.shared.model.TrustedContact
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.UUID

/** The phone is the source of truth for contacts and settings; every change is pushed to the watch. */
class ConfigRepository(
    context: Context,
    private val watchSync: WatchSync,
    private val scope: CoroutineScope,
) {
    private val prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    private val _config = MutableStateFlow(load())
    val config: StateFlow<AlertConfig> = _config.asStateFlow()

    fun addContact(name: String, telegramChatId: String) = update { config ->
        val contact = TrustedContact(UUID.randomUUID().toString(), name.trim(), telegramChatId.trim())
        config.copy(contacts = config.contacts + contact)
    }

    fun removeContact(id: String) = update { config ->
        config.copy(contacts = config.contacts.filterNot { it.id == id })
    }

    fun setAlertMessage(message: String) = update { it.copy(alertMessage = message.trim()) }

    fun setDemoMode(enabled: Boolean) = update { it.copy(demoMode = enabled) }

    private fun update(transform: (AlertConfig) -> AlertConfig) {
        val next = transform(_config.value)
        _config.value = next
        prefs.edit { putString(KEY_JSON, SyncJson.encodeToString(next)) }
        scope.launch { watchSync.publish(next) }
    }

    private fun load(): AlertConfig = prefs.getString(KEY_JSON, null)
        ?.let { runCatching { SyncJson.decodeFromString<AlertConfig>(it) }.getOrNull() }
        ?: AlertConfig()

    companion object {
        private const val FILE = "config"
        private const val KEY_JSON = "config_json"

        /** Telegram chat ids are integers (groups are negative); same rule as the backend. */
        private val CHAT_ID = Regex("^-?\\d{1,20}$")

        fun isValidChatId(value: String) = CHAT_ID.matches(value.trim())
    }
}
