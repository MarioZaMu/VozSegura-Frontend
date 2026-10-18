package com.vozsegura.mobile

import android.app.Application
import android.content.Context
import com.vozsegura.mobile.data.ConfigRepository
import com.vozsegura.mobile.data.HistoryRepository
import com.vozsegura.mobile.data.WatchSync
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch

/** Holds app-wide singletons (manual DI, same approach as the watch app). */
class VozSeguraApplication : Application() {

    val appScope: CoroutineScope = MainScope()

    val watchSync: WatchSync by lazy { WatchSync(this) }

    val configRepository: ConfigRepository by lazy { ConfigRepository(this, watchSync, appScope) }

    val historyRepository: HistoryRepository by lazy { HistoryRepository(this) }

    override fun onCreate() {
        super.onCreate()
        // Republish on start, so a watch installed after the last edit still gets the config.
        appScope.launch { watchSync.publish(configRepository.config.value) }
    }
}

val Context.vozSegura: VozSeguraApplication
    get() = applicationContext as VozSeguraApplication
