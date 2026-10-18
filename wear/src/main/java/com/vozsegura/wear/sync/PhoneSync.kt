package com.vozsegura.wear.sync

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.DataEvent
import com.google.android.gms.wearable.DataEventBuffer
import com.google.android.gms.wearable.DataItem
import com.google.android.gms.wearable.DataMapItem
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import com.vozsegura.shared.datalayer.DataLayerPaths
import com.vozsegura.shared.datalayer.SyncJson
import com.vozsegura.shared.model.AlertUpdate
import com.vozsegura.wear.WearApplication
import kotlinx.coroutines.tasks.await

/** Watch side of the Data Layer: receives config from the phone and reports alerts back. */
class PhoneSync(context: Context, private val store: WatchConfigStore) {

    private val dataClient = Wearable.getDataClient(context)
    private val messageClient = Wearable.getMessageClient(context)
    private val nodeClient = Wearable.getNodeClient(context)

    /** Picks up a config the phone published while this app was not running (or not installed). */
    suspend fun loadLatestConfig() {
        runCatching {
            val items = dataClient.dataItems.await()
            try {
                items.firstOrNull { it.uri.path == DataLayerPaths.CONFIG }?.let(::storeConfig)
            } finally {
                items.release()
            }
        }.onFailure { Log.w(TAG, "No Data Layer (watch not paired?): ${it.message}") }
    }

    fun storeConfig(item: DataItem) {
        DataMapItem.fromDataItem(item).dataMap.getString(DataLayerPaths.CONFIG_KEY)?.let(store::save)
    }

    /** Best effort: the phone history is a convenience, the alert itself never waits for it. */
    suspend fun report(update: AlertUpdate) {
        runCatching {
            val bytes = SyncJson.encodeToString(update).toByteArray()
            nodeClient.connectedNodes.await().forEach { node ->
                messageClient.sendMessage(node.id, DataLayerPaths.ALERT_EVENT, bytes).await()
            }
        }.onFailure { Log.w(TAG, "Could not report ${update.state} to the phone: ${it.message}") }
    }

    private companion object {
        const val TAG = "PhoneSync"
    }
}

/** Woken by the system when the phone changes the config, even if the app is not running. */
class PhoneSyncService : WearableListenerService() {
    override fun onDataChanged(dataEvents: DataEventBuffer) {
        val sync = (application as WearApplication).phoneSync
        dataEvents
            .filter { it.type == DataEvent.TYPE_CHANGED && it.dataItem.uri.path == DataLayerPaths.CONFIG }
            .forEach { sync.storeConfig(it.dataItem) }
    }
}
