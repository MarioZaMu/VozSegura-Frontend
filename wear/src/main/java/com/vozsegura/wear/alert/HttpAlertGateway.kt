package com.vozsegura.wear.alert

import android.net.Network
import android.util.Log
import com.vozsegura.shared.model.AlertPayload
import com.vozsegura.shared.model.CancelPayload
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.io.File
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

/**
 * Talks to voz-segura-backend. Plain HttpURLConnection: three small requests do not justify
 * an HTTP library on a watch. Every failure maps to `false`, so the state machine retries.
 *
 * Only the shared ALERT_API_TOKEN is embedded in the app. The Groq and Telegram keys stay
 * on the server, so a decompiled APK cannot spend AI credit or impersonate the bot.
 */
class HttpAlertGateway(
    private val networkAccess: NetworkAccess,
    baseUrl: String,
    private val apiToken: String,
    /** Asks the backend to simulate Telegram and Groq (presentation without real delivery). */
    private val demoMode: () -> Boolean = { false },
) : AlertGateway {

    private val baseUrl = baseUrl.trimEnd('/')

    override suspend fun sendAlert(payload: AlertPayload): Boolean =
        post("/api/alert", "application/json", Json.encodeToString(payload).toByteArray(), ALERT_TIMEOUT_MS)

    override suspend fun sendAudio(alertId: String, contactChatIds: List<String>, clip: File): Boolean {
        val query = "?alertId=${encode(alertId)}&chatIds=${encode(contactChatIds.joinToString(","))}"
        // Transcription + summary run inside this request, so it gets a longer timeout.
        return post("/api/audio$query", "audio/mp4", clip.readBytes(), AUDIO_TIMEOUT_MS)
    }

    override suspend fun sendCancellation(payload: CancelPayload) {
        post("/api/cancel", "application/json", Json.encodeToString(payload).toByteArray(), ALERT_TIMEOUT_MS)
    }

    private suspend fun post(path: String, contentType: String, body: ByteArray, timeoutMs: Int): Boolean =
        networkAccess.withNetwork { network ->
            withContext(Dispatchers.IO) { postOn(network, path, contentType, body, timeoutMs) }
        }

    private fun postOn(network: Network?, path: String, contentType: String, body: ByteArray, timeoutMs: Int): Boolean {
        val url = URL(baseUrl + path)
        val connection = (network?.openConnection(url) ?: url.openConnection()) as HttpURLConnection
        return try {
            connection.requestMethod = "POST"
            connection.connectTimeout = CONNECT_TIMEOUT_MS
            connection.readTimeout = timeoutMs
            connection.doOutput = true
            connection.setFixedLengthStreamingMode(body.size)
            connection.setRequestProperty("Content-Type", contentType)
            connection.setRequestProperty("Authorization", "Bearer $apiToken")
            if (demoMode()) connection.setRequestProperty("X-Demo-Mode", "true")
            connection.outputStream.use { it.write(body) }
            val status = connection.responseCode
            if (status !in 200..299) Log.w(TAG, "POST $path failed with HTTP $status")
            status in 200..299
        } catch (e: IOException) {
            Log.w(TAG, "POST $path failed: ${e.message}")
            false
        } finally {
            connection.disconnect()
        }
    }

    private fun encode(value: String) = URLEncoder.encode(value, Charsets.UTF_8.name())

    private companion object {
        const val TAG = "HttpAlertGateway"
        const val CONNECT_TIMEOUT_MS = 10_000
        const val ALERT_TIMEOUT_MS = 15_000
        const val AUDIO_TIMEOUT_MS = 60_000
    }
}
