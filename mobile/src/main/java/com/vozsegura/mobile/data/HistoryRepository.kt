package com.vozsegura.mobile.data

import android.content.Context
import androidx.core.content.edit
import com.vozsegura.shared.datalayer.SyncJson
import com.vozsegura.shared.model.AlertState
import com.vozsegura.shared.model.AlertUpdate
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.Serializable

/** One alert as the phone remembers it: its latest state plus whether contacts were ever notified. */
@Serializable
data class HistoryEntry(
    val alertId: String,
    val createdAtEpochMs: Long,
    val updatedAtEpochMs: Long,
    val state: AlertState,
    /** True once the alert reached SENT, so a later cancel means contacts got "estoy bien". */
    val contactsNotified: Boolean,
)

/** Alert history built from the watch updates. Stored only on this phone. */
class HistoryRepository(context: Context) {

    private val prefs = context.getSharedPreferences(FILE, Context.MODE_PRIVATE)

    private val _entries = MutableStateFlow(load())
    val entries: StateFlow<List<HistoryEntry>> = _entries.asStateFlow()

    /** Called from the Data Layer thread, hence synchronized. */
    @Synchronized
    fun record(update: AlertUpdate) {
        val previous = _entries.value.firstOrNull { it.alertId == update.alertId }
        val entry = HistoryEntry(
            alertId = update.alertId,
            createdAtEpochMs = update.createdAtEpochMs,
            updatedAtEpochMs = update.updatedAtEpochMs,
            state = update.state,
            contactsNotified = previous?.contactsNotified == true || update.state == AlertState.SENT,
        )
        save((_entries.value.filterNot { it.alertId == update.alertId } + entry)
            .sortedByDescending { it.createdAtEpochMs }
            .take(MAX_ENTRIES))
    }

    @Synchronized
    fun clear() = save(emptyList())

    private fun save(entries: List<HistoryEntry>) {
        _entries.value = entries
        prefs.edit { putString(KEY_JSON, SyncJson.encodeToString(entries)) }
    }

    private fun load(): List<HistoryEntry> = prefs.getString(KEY_JSON, null)
        ?.let { runCatching { SyncJson.decodeFromString<List<HistoryEntry>>(it) }.getOrNull() }
        ?: emptyList()

    private companion object {
        const val FILE = "history"
        const val KEY_JSON = "entries_json"
        const val MAX_ENTRIES = 50
    }
}
