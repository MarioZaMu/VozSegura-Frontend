package com.vozsegura.wear.alert

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

/**
 * Wear OS mediates Wi-Fi and cellular to save battery: an app that just opens a socket may get
 * no route at all. Apps must explicitly request a network, which also brings the radio up.
 * An emergency alert is exactly the case this API exists for.
 */
class NetworkAccess(context: Context) {

    private val connectivity = context.getSystemService(ConnectivityManager::class.java)

    private val request = NetworkRequest.Builder()
        .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        // Transport types are OR-ed: whichever of Wi-Fi or cellular comes up first.
        .addTransportType(NetworkCapabilities.TRANSPORT_WIFI)
        .addTransportType(NetworkCapabilities.TRANSPORT_CELLULAR)
        .build()

    /**
     * Runs [block] with a requested network, or with null (system default) if none comes up
     * within [timeoutMs]. The request is released afterwards so the radio can sleep again.
     */
    suspend fun <T> withNetwork(timeoutMs: Long = NETWORK_TIMEOUT_MS, block: suspend (Network?) -> T): T {
        var callback: ConnectivityManager.NetworkCallback? = null
        try {
            val network = withTimeoutOrNull(timeoutMs) {
                suspendCancellableCoroutine { continuation ->
                    val networkCallback = object : ConnectivityManager.NetworkCallback() {
                        override fun onAvailable(network: Network) {
                            if (continuation.isActive) continuation.resume(network)
                        }
                    }
                    callback = networkCallback
                    connectivity.requestNetwork(request, networkCallback)
                }
            }
            return block(network)
        } finally {
            callback?.let { runCatching { connectivity.unregisterNetworkCallback(it) } }
        }
    }

    private companion object {
        const val NETWORK_TIMEOUT_MS = 8_000L
    }
}
