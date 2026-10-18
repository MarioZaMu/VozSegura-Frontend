package com.vozsegura.mobile.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.NavHostController
import com.vozsegura.mobile.ui.screens.ContactsScreen
import com.vozsegura.mobile.ui.screens.DesignCatalogScreen
import com.vozsegura.mobile.ui.screens.GestureTestScreen
import com.vozsegura.mobile.ui.screens.HistoryScreen
import com.vozsegura.mobile.ui.screens.HomeScreen
import com.vozsegura.mobile.ui.screens.SettingsScreen
import com.vozsegura.mobile.ui.theme.VsColors

@Composable
fun VozSeguraApp() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = backStackEntry?.destination

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = VsColors.Surface) {
                TopLevelDestination.entries.forEach { destination ->
                    val selected = currentDestination?.hasRoute(destination.route::class) == true
                    NavigationBarItem(
                        selected = selected,
                        onClick = { navController.navigateToTab(destination) },
                        icon = {
                            Icon(
                                painter = painterResource(destination.iconRes),
                                contentDescription = null,
                            )
                        },
                        label = { Text(stringResource(destination.labelRes)) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = VsColors.PrimaryLight,
                            selectedTextColor = VsColors.TextPrimary,
                            indicatorColor = VsColors.SurfaceElevated,
                            unselectedIconColor = VsColors.TextSecondary,
                            unselectedTextColor = VsColors.TextSecondary,
                        ),
                    )
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = HomeRoute,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable<HomeRoute> {
                HomeScreen(
                    onTestGesture = { navController.navigate(GestureTestRoute) },
                    onOpenContacts = { navController.navigateToTab(TopLevelDestination.CONTACTS) },
                    onOpenHistory = { navController.navigateToTab(TopLevelDestination.HISTORY) },
                )
            }
            composable<ContactsRoute> { ContactsScreen() }
            composable<HistoryRoute> { HistoryScreen() }
            composable<SettingsRoute> {
                SettingsScreen(onOpenDesignSystem = { navController.navigate(DesignCatalogRoute) })
            }
            composable<GestureTestRoute> { GestureTestScreen(onBack = navController::popBackStack) }
            composable<DesignCatalogRoute> { DesignCatalogScreen(onBack = navController::popBackStack) }
        }
    }
}

private fun NavHostController.navigateToTab(destination: TopLevelDestination) {
    navigate(destination.route) {
        // Keep a single copy of each tab and restore its state.
        popUpTo(graph.findStartDestination().id) {
            saveState = true
        }
        launchSingleTop = true
        restoreState = true
    }
}
