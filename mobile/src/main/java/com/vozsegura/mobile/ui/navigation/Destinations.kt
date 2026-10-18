package com.vozsegura.mobile.ui.navigation

import androidx.annotation.DrawableRes
import androidx.annotation.StringRes
import com.vozsegura.mobile.R
import kotlinx.serialization.Serializable

@Serializable
data object HomeRoute

@Serializable
data object ContactsRoute

@Serializable
data object HistoryRoute

@Serializable
data object SettingsRoute

@Serializable
data object GestureTestRoute

@Serializable
data object DesignCatalogRoute

/** Top-level destinations shown in the bottom navigation bar. */
enum class TopLevelDestination(
    val route: Any,
    @param:StringRes val labelRes: Int,
    @param:DrawableRes val iconRes: Int,
) {
    HOME(HomeRoute, R.string.nav_home, R.drawable.ic_home),
    CONTACTS(ContactsRoute, R.string.nav_contacts, R.drawable.ic_contacts),
    HISTORY(HistoryRoute, R.string.nav_history, R.drawable.ic_history),
    SETTINGS(SettingsRoute, R.string.nav_settings, R.drawable.ic_settings),
}
