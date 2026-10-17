package com.vozsegura.wear.presentation

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.wear.ambient.AmbientLifecycleObserver
import com.vozsegura.wear.presentation.ambient.AmbientMode
import com.vozsegura.wear.presentation.ambient.AmbientState
import com.vozsegura.wear.presentation.navigation.WearApp

class MainActivity : ComponentActivity() {

    private val ambientMode = mutableStateOf<AmbientMode>(AmbientMode.Interactive)

    /** Incremented by the system once a minute while in ambient, to refresh the clock. */
    private val ambientTick = mutableIntStateOf(0)

    private val ambientCallback = object : AmbientLifecycleObserver.AmbientLifecycleCallback {
        override fun onEnterAmbient(ambientDetails: AmbientLifecycleObserver.AmbientDetails) {
            ambientMode.value = AmbientMode.Ambient(
                burnInProtectionRequired = ambientDetails.burnInProtectionRequired,
                lowBitAmbient = ambientDetails.deviceHasLowBitAmbient,
            )
        }

        override fun onUpdateAmbient() {
            ambientTick.intValue++
        }

        override fun onExitAmbient() {
            ambientMode.value = AmbientMode.Interactive
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        // Supporting ambient keeps our face on screen when the wrist drops, instead of the system face.
        lifecycle.addObserver(AmbientLifecycleObserver(this, ambientCallback))
        setContent {
            WearApp(ambientState = AmbientState(ambientMode.value, ambientTick.intValue))
        }
    }
}
