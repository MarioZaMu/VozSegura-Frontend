package com.vozsegura.wear.presentation.watchface

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.LocalContext
import androidx.core.content.ContextCompat
import java.time.LocalDateTime

/**
 * Registers a receiver for system [actions] while in composition. Sticky broadcasts
 * (e.g. battery) are delivered immediately on registration.
 */
@Composable
private fun SystemBroadcastEffect(vararg actions: String, onReceive: (Intent) -> Unit) {
    val context = LocalContext.current
    val currentOnReceive by rememberUpdatedState(onReceive)
    DisposableEffect(context, *actions) {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context, intent: Intent) = currentOnReceive(intent)
        }
        val filter = IntentFilter().apply { actions.forEach(::addAction) }
        // System broadcasts still reach a NOT_EXPORTED receiver.
        val sticky = ContextCompat.registerReceiver(
            context, receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED,
        )
        sticky?.let(currentOnReceive)
        onDispose { context.unregisterReceiver(receiver) }
    }
}

/**
 * Current local time, refreshed on every system minute tick and on time/zone changes,
 * like a real watch face (no busy per-second loop). [refreshKey] forces a re-read,
 * used by ambient mode's once-a-minute update callback.
 */
@Composable
fun rememberCurrentTime(refreshKey: Any): LocalDateTime {
    var now by remember { mutableStateOf(LocalDateTime.now()) }
    LaunchedEffect(refreshKey) { now = LocalDateTime.now() }
    SystemBroadcastEffect(
        Intent.ACTION_TIME_TICK,
        Intent.ACTION_TIME_CHANGED,
        Intent.ACTION_TIMEZONE_CHANGED,
    ) {
        now = LocalDateTime.now()
    }
    return now
}

/** Battery percentage (0..100), or -1 until the first sticky broadcast arrives. */
@Composable
fun rememberBatteryPercent(): Int {
    var percent by remember { mutableIntStateOf(-1) }
    SystemBroadcastEffect(Intent.ACTION_BATTERY_CHANGED) { intent ->
        val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
        val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
        if (level >= 0 && scale > 0) percent = level * 100 / scale
    }
    return percent
}
