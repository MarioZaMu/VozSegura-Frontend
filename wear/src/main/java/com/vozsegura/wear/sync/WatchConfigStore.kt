package com.vozsegura.wear.sync

import android.content.Context
import androidx.core.content.edit
import com.vozsegura.shared.datalayer.SyncJson
import com.vozsegura.shared.model.AlertConfig

/**
 * Last config received from the phone, kept on the watch so an alert never depends on the
 * phone being nearby. Defaults (no contacts) still alert the backend's DEFAULT_CHAT_IDS.
 */
class WatchConfigStore(context: Context) {

    private val prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    @Volatile
    var current: AlertConfig = decode(prefs.getString(KEY_JSON, null)) ?: AlertConfig()
        private set

    fun save(json: String) {
        val config = decode(json) ?: return
        prefs.edit { putString(KEY_JSON, json) }
        current = config
    }

    private fun decode(json: String?): AlertConfig? =
        json?.let { runCatching { SyncJson.decodeFromString<AlertConfig>(it) }.getOrNull() }

    private companion object {
        const val FILE = "phone_config"
        const val KEY_JSON = "config_json"
    }
}
