package com.vozsegura.wear.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.vozsegura.wear.BuildConfig
import com.vozsegura.wear.gesture.HiddenGesture
import com.vozsegura.wear.gesture.HiddenGestureLayer
import com.vozsegura.wear.haptics.HapticSignal
import com.vozsegura.wear.presentation.ambient.AmbientState
import com.vozsegura.wear.presentation.ambient.LocalAmbientState
import com.vozsegura.wear.presentation.debug.HapticEchoOverlay
import com.vozsegura.wear.presentation.theme.VozSeguraTheme
import com.vozsegura.wear.presentation.watchface.WatchFaceScreen
import kotlinx.coroutines.flow.Flow

/** Routes of the watch app. The watch face is the only visible screen by design. */
object WearRoutes {
    const val WATCH_FACE = "watch_face"
}

@Composable
fun WearApp(
    ambientState: AmbientState,
    onHiddenGesture: (HiddenGesture) -> Unit,
    hapticSignals: Flow<HapticSignal>,
) {
    // Destination lambdas are captured once, so route through an always-current reference.
    val currentOnHiddenGesture by rememberUpdatedState(onHiddenGesture)
    VozSeguraTheme {
        CompositionLocalProvider(LocalAmbientState provides ambientState) {
            // No system TimeText: the watch face draws its own clock, a second one would give it away.
            AppScaffold(timeText = {}) {
                val navController = rememberSwipeDismissableNavController()
                SwipeDismissableNavHost(
                    navController = navController,
                    startDestination = WearRoutes.WATCH_FACE,
                ) {
                    composable(WearRoutes.WATCH_FACE) {
                        // The watch face never reads the alert phase: it looks identical in every state.
                        HiddenGestureLayer(onGesture = { currentOnHiddenGesture(it) }) {
                            WatchFaceScreen()
                        }
                    }
                }
                if (BuildConfig.DEBUG) HapticEchoOverlay(hapticSignals)
            }
        }
    }
}
