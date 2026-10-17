package com.vozsegura.wear

import android.app.Application
import com.vozsegura.wear.alert.AlertController
import com.vozsegura.wear.alert.AudioClipRecorder
import com.vozsegura.wear.alert.FakeAlertGateway
import com.vozsegura.wear.alert.ForegroundAlertSession
import com.vozsegura.wear.alert.LocationProvider
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
            // Demo gateway until the backend exists (phase 7).
            gateway = FakeAlertGateway(),
            haptics = haptics,
            session = ForegroundAlertSession(this),
            locationProvider = LocationProvider(this),
            recorder = AudioClipRecorder(this),
        )
    }
}
