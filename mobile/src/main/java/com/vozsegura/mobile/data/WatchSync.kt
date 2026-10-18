package com.vozsegura.mobile.data

import android.content.Context
import android.util.Log
import com.google.android.gms.wearable.MessageEvent
import com.google.android.gms.wearable.PutDataMapRequest
import com.google.android.gms.wearable.Wearable
import com.google.android.gms.wearable.WearableListenerService
import com.vozsegura.mobile.vozSegura
import com.vozsegura.shared.datalayer.DataLayerPaths
import com.vozsegura.shared.datalayer.SyncJson
import com.vozsegura.shared.model.AlertConfig
import com.vozsegura.shared.model.AlertUpdate
import kotlinx.coroutines.tasks.await

/** Phone side of the Data Layer: publishes the config to the watch and tells whether one is connected. */
class WatchSync(context: Context) {

    private val dataClient = Wearable.getDataClient(context)
    private val nodeClient = Wearable.getNodeClient(context)

    /**
     * Stores the config as a DataItem. The Data Layer queues it and delivers it whenever the
     * watch connects, so this succeeds even with the watch away.
     */
    suspend fun publish(config: AlertConfig) {
        runCatching {
            val request = PutDataMapRequest.create(DataLayerPaths.CONFIG).apply {
                dataMap.putString(DataLayerPaths.CONFIG_KEY, SyncJson.encodeToString(config))
            }.asPutDataRequest().setUrgent()
            dataClient.putDataItem(request).await()
        }.onFailure { Log.w(TAG, "Could not publish config: ${it.message}") }
    }

    /** Name of a connected watch, or null if none (or Wear OS is not installed on this phone). */
    suspend fun connectedWatchName(): String? =
        runCatching { nodeClient.connectedNodes.await().firstOrNull()?.displayName }.getOrNull()

    private companion object {
        const val TAG = "WatchSync"
    }
}

/** Woken by the system when the watch reports an alert, even if the app is closed. */
class WatchEventService : WearableListenerService() {
    override fun onMessageReceived(messageEvent: MessageEvent) {
        if (messageEvent.path != DataLayerPaths.ALERT_EVENT) return
        val update = runCatching {
            SyncJson.decodeFromString<AlertUpdate>(messageEvent.data.decodeToString())
        }.getOrNull() ?: return
        vozSegura.historyRepository.record(update)
    }
}
