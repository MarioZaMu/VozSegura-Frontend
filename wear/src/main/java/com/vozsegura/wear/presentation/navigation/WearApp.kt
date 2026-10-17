package com.vozsegura.wear.presentation.navigation

import androidx.compose.runtime.Composable
import androidx.wear.compose.material3.AppScaffold
import androidx.wear.compose.navigation.SwipeDismissableNavHost
import androidx.wear.compose.navigation.composable
import androidx.wear.compose.navigation.rememberSwipeDismissableNavController
import com.vozsegura.wear.presentation.theme.VozSeguraTheme
import com.vozsegura.wear.presentation.watchface.WatchFaceScreen

/** Routes of the watch app. The watch face is the only visible screen by design. */
object WearRoutes {
    const val WATCH_FACE = "watch_face"
}

@Composable
fun WearApp() {
    VozSeguraTheme {
        AppScaffold {
            val navController = rememberSwipeDismissableNavController()
            SwipeDismissableNavHost(
                navController = navController,
                startDestination = WearRoutes.WATCH_FACE,
            ) {
                composable(WearRoutes.WATCH_FACE) { WatchFaceScreen() }
            }
        }
    }
}
