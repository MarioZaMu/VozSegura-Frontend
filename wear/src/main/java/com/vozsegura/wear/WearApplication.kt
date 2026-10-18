package com.vozsegura.wear

import android.app.Application
import com.vozsegura.shared.model.AlertState
import com.vozsegura.shared.model.AlertUpdate
import com.vozsegura.wear.alert.AlertController
import com.vozsegura.wear.alert.AlertGateway
import com.vozsegura.wear.alert.AudioClipRecorder
import com.vozsegura.wear.alert.FakeAlertGateway
import com.vozsegura.wear.alert.ForegroundAlertSession
import com.vozsegura.wear.alert.HttpAlertGateway
import com.vozsegura.wear.alert.LocationProvider
import com.vozsegura.wear.alert.NetworkAccess
import com.vozsegura.wear.alert.toAlertState
import com.vozsegura.wear.haptics.Haptics
import com.vozsegura.wear.sync.PhoneSync
import com.vozsegura.wear.sync.WatchConfigStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.filter
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch

/** Holds app-wide singletons (manual DI; the app is small enough not to need Hilt). */
class WearApplication : Application() {

    /** Process-wide scope: an alert must keep running after the activity is gone. */
    val appScope: CoroutineScope = MainScope()

    val haptics: Haptics by lazy { Haptics(this) }

    val configStore: WatchConfigStore by lazy { WatchConfigStore(this) }

    val phoneSync: PhoneSync by lazy { PhoneSync(this, configStore) }

    val alertController: AlertController by lazy {
        AlertController(
            scope = appScope,
            gateway = createGateway(),
            haptics = haptics,
            session = ForegroundAlertSession(this),
            locationProvider = LocationProvider(this),
            recorder = AudioClipRecorder(this),
            config = { configStore.current },
        )
    }

    override fun onCreate() {
        super.onCreate()
        appScope.launch { phoneSync.loadLatestConfig() }
        appScope.launch { reportAlertsToPhone() }
    }

    private suspend fun reportAlertsToPhone() {
        alertController.phase
            .map { it.toAlertState() }
            .distinctUntilChanged()
            .filter { it != AlertState.IDLE }
            .collect { state ->
                phoneSync.report(
                    AlertUpdate(
                        alertId = alertController.alertId,
                        state = state,
                        createdAtEpochMs = alertController.createdAtEpochMs,
                        updatedAtEpochMs = System.currentTimeMillis(),
                    ),
                )
            }
    }

    /**
     * Real backend when local.properties defines it; otherwise the offline fake, so a fresh
     * clone (or a classroom with no internet) still runs the whole flow.
     */
    private fun createGateway(): AlertGateway =
        if (BuildConfig.BACKEND_URL.isNotBlank() && BuildConfig.ALERT_API_TOKEN.isNotBlank()) {
            HttpAlertGateway(
                networkAccess = NetworkAccess(this),
                baseUrl = BuildConfig.BACKEND_URL,
                apiToken = BuildConfig.ALERT_API_TOKEN,
                demoMode = { configStore.current.demoMode },
            )
        } else {
            FakeAlertGateway()
        }
}
