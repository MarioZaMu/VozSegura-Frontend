package com.vozsegura.wear.alert

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource
import com.google.android.gms.tasks.Task
import com.vozsegura.shared.model.AlertLocation
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

/** One-shot location for an alert: a fresh fix if it arrives in time, else the last known one. */
class LocationProvider(private val context: Context) {

    private val client = LocationServices.getFusedLocationProviderClient(context)

    @SuppressLint("MissingPermission") // Checked by AlertPermissions.hasLocation.
    suspend fun currentOrNull(timeoutMs: Long = FRESH_FIX_TIMEOUT_MS): AlertLocation? {
        if (!AlertPermissions.hasLocation(context)) return null
        val tokenSource = CancellationTokenSource()
        val fresh = withTimeoutOrNull(timeoutMs) {
            client.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, tokenSource.token).awaitOrNull()
        }
        tokenSource.cancel()
        return (fresh ?: client.lastLocation.awaitOrNull())?.toAlertLocation()
    }

    private fun Location.toAlertLocation() = AlertLocation(
        latitude = latitude,
        longitude = longitude,
        accuracyMeters = if (hasAccuracy()) accuracy else null,
        capturedAtEpochMs = time,
    )

    private suspend fun <T> Task<T>.awaitOrNull(): T? = suspendCancellableCoroutine { continuation ->
        addOnSuccessListener { continuation.resume(it) }
        addOnFailureListener { continuation.resume(null) }
        addOnCanceledListener { continuation.resume(null) }
    }

    companion object {
        /** Fetching starts at the double tap, so this mostly overlaps the 4 s grace window. */
        const val FRESH_FIX_TIMEOUT_MS = 6_000L
    }
}
