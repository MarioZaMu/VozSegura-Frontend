package com.vozsegura.wear

import android.app.Application
import com.vozsegura.wear.alert.AlertController
import com.vozsegura.wear.alert.AlertGateway
import com.vozsegura.wear.alert.AudioClipRecorder
import com.vozsegura.wear.alert.FakeAlertGateway
import com.vozsegura.wear.alert.ForegroundAlertSession
import com.vozsegura.wear.alert.HttpAlertGateway
import com.vozsegura.wear.alert.LocationProvider
import com.vozsegura.wear.alert.NetworkAccess
import com.vozsegura.wear.haptics.Haptics
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.MainScope

/** Holds app-wide singletons (manual DI; the app is small enough not to need Hilt). */
class WearApplication : Application() {

    /** Process-wide scope: an alert must keep running after the activity is gone. */
    val appScope: CoroutineScope = MainScope()

    val haptics: Haptics by lazy { Haptics(this) }

    val alertController: AlertController by lazy {
        AlertController(
            scope = appScope,
            gateway = createGateway(),
            haptics = haptics,
            session = ForegroundAlertSession(this),
            locationProvider = LocationProvider(this),
            recorder = AudioClipRecorder(this),
        )
    }

    /**
     * Real backend when local.properties defines it; otherwise the offline fake, so a fresh
     * clone (or a classroom with no internet) still runs the whole flow.
     */
    private fun createGateway(): AlertGateway =
        if (BuildConfig.BACKEND_URL.isNotBlank() && BuildConfig.ALERT_API_TOKEN.isNotBlank()) {
            HttpAlertGateway(NetworkAccess(this), BuildConfig.BACKEND_URL, BuildConfig.ALERT_API_TOKEN)
        } else {
            FakeAlertGateway()
        }
}
